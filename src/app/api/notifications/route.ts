import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isOutcomeNotificationType } from "@/lib/notificationOutcome";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    select: { id: true },
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rawNotifications = await prisma.notification.findMany({
    where: { user_id: currentUser.id },
    orderBy: { created_at: "desc" },
    take: 50,
    include: { team: { select: { id: true, name: true } } },
  });

  // Batch the "does a matching pending join request still exist?" check for all
  // new_join_request notifications in one query instead of one per notification.
  const requestNotifications = rawNotifications.filter((n) => n.type === "new_join_request");
  const pendingRequests = new Set<string>();
  if (requestNotifications.length > 0) {
    const myTeams = await prisma.team.findMany({
      where: { leader_id: currentUser.id },
      select: { id: true },
    });
    const teamIds = myTeams.map((t) => t.id);
    const matches = await prisma.joinRequest.findMany({
      where: {
        status: "pending",
        OR: [
          { requester_id: currentUser.id },
          ...(teamIds.length > 0 ? [{ team_id: { in: teamIds } }] : []),
        ],
      },
      select: {
        id: true,
        team_id: true,
        requester_id: true,
        requester: { select: { name: true } },
      },
    });
    // Keyed by team+requester-name so a leader's notification matches its applicant.
    for (const m of matches) {
      pendingRequests.add(`${m.team_id}::${m.requester.name.toLowerCase()}`);
      if (m.requester_id === currentUser.id) pendingRequests.add(`mine::${m.team_id}`);
    }
  }

  const validNotifications = [];
  const notificationsToDelete = [];

  for (const n of rawNotifications) {
    // Outcome notifications that have already been read are one-time status
    // updates with nothing left to act on — drop them from the feed entirely
    // (and delete them so they never reappear).
    if (n.read_status === "read" && isOutcomeNotificationType(n.type)) {
      notificationsToDelete.push(n.id);
      continue;
    }

    if (n.type === "new_join_request") {
      const p = (n.payload || {}) as Record<string, unknown>;
      const name = String(p.requester_name || "").toLowerCase();
      // Without a team reference we can't verify the request still exists —
      // keep the notification rather than risk dropping a live lead.
      const stillPending =
        !n.team_id ||
        pendingRequests.has(`mine::${n.team_id}`) ||
        (name ? pendingRequests.has(`${n.team_id}::${name}`) : false);

      if (!stillPending) {
        notificationsToDelete.push(n.id);
        continue;
      }
    }
    validNotifications.push(n);
  }

  if (notificationsToDelete.length > 0) {
    await prisma.notification.deleteMany({
      where: { id: { in: notificationsToDelete } }
    });
  }

  // Enrich each notification payload with a fallback team name from the relation,
  // so legacy/edge notifications never render empty team quotes.
  const enriched = validNotifications.map(({ team, payload, ...n }) => {
    const p = (payload ?? {}) as Record<string, unknown>;
    return {
      ...n,
      team_id: n.team_id,
      payload: {
        ...p,
        ...(p.team_name ? {} : team?.name ? { team_name: team.name } : {}),
      },
    };
  });

  return NextResponse.json({ notifications: enriched });
}
