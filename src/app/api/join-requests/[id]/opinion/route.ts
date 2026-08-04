import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { opinion } = body;
  if (!opinion || !["approve", "reject", "neutral"].includes(opinion)) {
    return NextResponse.json({ error: "Invalid opinion. Must be approve, reject, or neutral." }, { status: 400 });
  }

  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: id },
  });
  if (!joinRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (joinRequest.status !== "pending") return NextResponse.json({ error: "Request is not pending" }, { status: 400 });

  // Ensure caller is a member of the team
  const isMember = currentUser.team_memberships.some(m => m.team_id === joinRequest.team_id);
  if (!isMember) return NextResponse.json({ error: "You are not a member of this team." }, { status: 403 });

  // Upsert opinion
  const upsertedOpinion = await prisma.$transaction(async (tx) => {
    const op = await tx.joinRequestOpinion.upsert({
      where: {
        request_id_member_id: {
          request_id: joinRequest.id,
          member_id: currentUser.id,
        }
      },
      update: { opinion: opinion as any },
      create: {
        request_id: joinRequest.id,
        member_id: currentUser.id,
        opinion: opinion as any,
      }
    });

    // Notify the leader
    // For simplicity, we can fetch team leader id
    const team = await tx.team.findUnique({ where: { id: joinRequest.team_id } });
    if (team && team.leader_id !== currentUser.id) {
      await tx.notification.create({
        data: {
          user_id: team.leader_id,
          type: "teammate_opinion_added",
          team_id: team.id,
          payload: { user_name: currentUser.name }
        }
      });
    }

    return op;
  });

  return NextResponse.json({ opinion: upsertedOpinion });
}
