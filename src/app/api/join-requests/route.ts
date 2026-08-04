import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { RequestDirection } from "@prisma/client";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 1. Requests involving the current user (sent by user or invites to user)
  const myRequests = await prisma.joinRequest.findMany({
    where: { requester_id: currentUser.id },
    include: {
      team: { select: { id: true, name: true, domain_interest: true } },
    },
    orderBy: { created_at: "desc" },
  });

  // 2. If user is in a team, fetch requests directed to that team (user_to_team)
  let teamRequests: any[] = [];
  if (currentUser.team_memberships.length > 0) {
    const teamId = currentUser.team_memberships[0].team_id;
    teamRequests = await prisma.joinRequest.findMany({
      where: { team_id: teamId, direction: "user_to_team" },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            department: true,
            gender: true,
            past_hackathons_count: true,
            skills: { select: { skill: true, proficiency: true } },
            presentation_skill_rating: true,
            // Contact info hidden until accepted (identity reveal rule)
          }
        },
        opinions: {
          include: {
            team_member: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { created_at: "desc" },
    });
  }

  return NextResponse.json({ myRequests, teamRequests });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { team_id, user_id, direction = "user_to_team" } = body;

  if (direction === "user_to_team") {
    if (!team_id) return NextResponse.json({ error: "team_id is required" }, { status: 400 });
    
    // Check if user is already in a team
    if (currentUser.team_memberships.length > 0) {
      return NextResponse.json({ error: "You are already in a team." }, { status: 400 });
    }

    // Check if team is full
    const team = await prisma.team.findUnique({ where: { id: team_id } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "full") return NextResponse.json({ error: "This team is already full." }, { status: 400 });

    // Ensure no pending request exists
    const existing = await prisma.joinRequest.findFirst({
      where: { team_id, requester_id: currentUser.id, status: "pending" }
    });
    if (existing) return NextResponse.json({ error: "You already have a pending request for this team." }, { status: 409 });

    const newRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.joinRequest.create({
        data: {
          team_id,
          requester_id: currentUser.id,
          direction: "user_to_team",
          status: "pending",
        }
      });
      await tx.notification.create({
        data: {
          user_id: team.leader_id,
          type: "new_join_request",
          team_id: team.id,
          payload: { user_name: currentUser.name }
        }
      });
      return req;
    });
    return NextResponse.json({ joinRequest: newRequest }, { status: 201 });
  } 
  else if (direction === "team_to_user") {
    if (!user_id) return NextResponse.json({ error: "user_id is required for team invites" }, { status: 400 });
    
    if (currentUser.team_memberships.length === 0) {
      return NextResponse.json({ error: "You are not in a team." }, { status: 400 });
    }

    const membership = currentUser.team_memberships[0];
    if (membership.role !== "leader") {
      return NextResponse.json({ error: "Only team leaders can send invites." }, { status: 403 });
    }

    const team = await prisma.team.findUnique({ where: { id: membership.team_id } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "full") return NextResponse.json({ error: "Your team is full." }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id: user_id }, include: { team_memberships: true } });
    if (!targetUser) return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    if (targetUser.team_memberships.length > 0) return NextResponse.json({ error: "User is already in a team." }, { status: 400 });

    const existing = await prisma.joinRequest.findFirst({
      where: { team_id: team.id, requester_id: user_id, status: "pending" }
    });
    if (existing) return NextResponse.json({ error: "A pending request already exists between your team and this user." }, { status: 409 });

    const newRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.joinRequest.create({
        data: {
          team_id: team.id,
          requester_id: user_id,
          direction: "team_to_user",
          status: "pending",
        }
      });
      await tx.notification.create({
        data: {
          user_id: user_id,
          type: "new_join_request",
          team_id: team.id,
          payload: { team_name: team.name }
        }
      });
      return req;
    });
    return NextResponse.json({ joinRequest: newRequest }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
}
