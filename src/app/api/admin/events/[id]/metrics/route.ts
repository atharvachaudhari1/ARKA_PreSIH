import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });

  if (!currentUser || !currentUser.is_admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      teams: {
        include: { memberships: true }
      }
    }
  });

  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  let totalTeams = event.teams.length;
  let fullTeams = event.teams.filter(t => t.status === "full").length;
  
  // Calculate Open Vacancies: sum of (event.team_size_max - current_member_count) across non-full teams
  let openVacancies = event.teams
    .filter(t => t.status !== "full")
    .reduce((sum, t) => sum + Math.max(0, event.team_size_max - t.memberships.length), 0);

  // Calculate Unmatched Users
  // Users who have NO TeamMembership for this event AND NO pending JoinRequest for this event
  const allUsersCount = await prisma.user.count();

  const matchedOrPendingUsersCount = await prisma.user.count({
    where: {
      OR: [
        { team_memberships: { some: { team: { event_id: eventId } } } },
        { sent_requests: { some: { team: { event_id: eventId }, status: "pending" } } }
      ]
    }
  });

  const unmatchedUsers = allUsersCount - matchedOrPendingUsersCount;

  return NextResponse.json({
    metrics: {
      total_teams: totalTeams,
      full_teams: fullTeams,
      open_vacancies: openVacancies,
      total_platform_users: allUsersCount,
      unmatched_users: unmatchedUsers
    }
  });
}
