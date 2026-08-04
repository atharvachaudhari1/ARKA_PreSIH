import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
      select: { id: true },
    });
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id: teamId } = await params;
    const body = await request.json();
    const { new_leader_id } = body;

    if (!new_leader_id) {
      return NextResponse.json({ error: "new_leader_id is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { memberships: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.leader_id !== currentUser.id) {
      return NextResponse.json({ error: "Only the current leader can transfer leadership" }, { status: 403 });
    }

    if (team.leader_id === new_leader_id) {
      return NextResponse.json({ error: "You are already the leader" }, { status: 400 });
    }

    const isMember = team.memberships.some(m => m.user_id === new_leader_id);
    if (!isMember) {
      return NextResponse.json({ error: "New leader must be a member of the team" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.teamMembership.update({
        where: { team_id_user_id: { team_id: teamId, user_id: currentUser.id } },
        data: { role: "member" },
      }),
      prisma.teamMembership.update({
        where: { team_id_user_id: { team_id: teamId, user_id: new_leader_id } },
        data: { role: "leader" },
      }),
      prisma.team.update({
        where: { id: teamId },
        data: { leader_id: new_leader_id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error transferring leadership:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
