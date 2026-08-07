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
    include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } } } }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 1. Requests involving the current user (sent by user or invites to user)
  const myRequests = await prisma.joinRequest.findMany({
    where: { requester_id: currentUser.id },
    include: {
      team: { select: { id: true, name: true, domain_interest: true, skills_needed: true, slots: true } },
    },
    orderBy: { created_at: "desc" },
  });

  // 2. If user is in a team, fetch requests directed to that team (user_to_team)
  // 3. If user is in a team AND is leader, fetch invites sent by that team (team_to_user)
  let teamRequests: any[] = [];
  let outboundInvites: any[] = [];

  if (currentUser.team_memberships.length > 0) {
    const teamIds = currentUser.team_memberships.map(m => m.team_id);
    const leaderTeamIds = currentUser.team_memberships.filter(m => m.role === "leader").map(m => m.team_id);
    
    // Inbound applications (for any team the user is in)
    teamRequests = await prisma.joinRequest.findMany({
      where: { team_id: { in: teamIds }, direction: "user_to_team", status: "pending" },
      include: {
        team: { include: { slots: true } },
        requester: {
          select: {
            id: true,
            name: true,
            department: true,
            gender: true,
            past_hackathons_count: true,
            skills: { select: { skill: true, proficiency: true } },
            presentation_skill_rating: true,
            bio: true,
            phone_number: true,
            whatsapp_number: true,
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

    // Outbound invites (for teams where user is a leader)
    if (leaderTeamIds.length > 0) {
      outboundInvites = await prisma.joinRequest.findMany({
        where: { team_id: { in: leaderTeamIds }, direction: "team_to_user", status: "pending" },
        include: {
          team: { include: { slots: true } },
          requester: {
            select: {
              id: true,
              name: true,
              department: true,
              gender: true,
              past_hackathons_count: true,
              skills: { select: { skill: true, proficiency: true } },
              presentation_skill_rating: true,
              bio: true,
              phone_number: true,
              whatsapp_number: true,
            }
          }
        },
        orderBy: { created_at: "desc" },
      });
    }
  }

  return NextResponse.json({ myRequests, teamRequests, outboundInvites });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } } } }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { team_id, user_id, direction = "user_to_team", applicantBio, applicantSkills } = body;

  if (direction === "user_to_team") {
    if (!team_id) return NextResponse.json({ error: "team_id is required" }, { status: 400 });
    
    // Check if user is already in a team
    if (currentUser.team_memberships.length > 0) {
      return NextResponse.json({ error: "You are already in a team." }, { status: 400 });
    }

    // Check if team is full
    const team = await prisma.team.findUnique({
      where: { id: team_id },
      include: { event: true, _count: { select: { memberships: true } } }
    });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "full") return NextResponse.json({ error: "This team is already full." }, { status: 400 });
    const currentMembers = team._count?.memberships ?? 0;
    const maxSize = team.event?.team_size_max;
    if (maxSize != null && currentMembers >= maxSize) {
      return NextResponse.json({ error: "This team is already full." }, { status: 400 });
    }

    if (!applicantBio || typeof applicantBio !== "string" || !applicantBio.trim()) {
      return NextResponse.json({ error: "Your bio/description is required to join a team." }, { status: 400 });
    }

    // Ensure no pending request exists
    const existing = await prisma.joinRequest.findFirst({
      where: { team_id, requester_id: currentUser.id, status: "pending" }
    });
    if (existing) return NextResponse.json({ error: "You already have a pending request for this team." }, { status: 409 });

    const newRequest = await prisma.$transaction(async (tx) => {
      // Update bio and skills if provided
      if (typeof applicantBio === "string") {
        await tx.user.update({
          where: { id: currentUser.id },
          data: { bio: applicantBio.trim() }
        });
      }
      
      if (Array.isArray(applicantSkills)) {
        await tx.userSkill.deleteMany({ where: { user_id: currentUser.id } });
        if (applicantSkills.length > 0) {
          await tx.userSkill.createMany({
            data: applicantSkills.map((skill: string) => ({
              user_id: currentUser.id,
              skill,
              proficiency: "intermediate"
            })),
            skipDuplicates: true
          });
        }
      }

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
          payload: { requester_name: currentUser.name, team_name: team.name }
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

    const team = await prisma.team.findUnique({
      where: { id: membership.team_id },
      include: { event: true, _count: { select: { memberships: true } } }
    });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team.status === "full") return NextResponse.json({ error: "Your team is full." }, { status: 400 });
    const currentMembers = team._count?.memberships ?? 0;
    const maxSize = team.event?.team_size_max;
    if (maxSize != null && currentMembers >= maxSize) {
      return NextResponse.json({ error: "Your team is full." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: user_id }, include: { team_memberships: { where: { team: { status: { not: 'dissolved' } } } } } });
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
          payload: { team_name: team.name, requester_name: team.name }
        }
      });
      return req;
    });
    return NextResponse.json({ joinRequest: newRequest }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
}
