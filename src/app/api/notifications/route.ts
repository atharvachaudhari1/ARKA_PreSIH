import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const rawNotifications = await prisma.notification.findMany({
    where: { user_id: currentUser.id },
    orderBy: { created_at: "desc" },
    take: 50,
    include: { team: { select: { id: true, name: true } } },
  });

  const validNotifications = [];
  const notificationsToDelete = [];

  for (const n of rawNotifications) {
    if (n.type === "new_join_request") {
      const p = (n.payload || {}) as Record<string, unknown>;
      const pendingRequestExists = await prisma.joinRequest.findFirst({
        where: {
          team_id: n.team_id,
          status: "pending",
          OR: [
            { requester_id: currentUser.id },
            { 
              team: { leader_id: currentUser.id },
              requester: { name: String(p.requester_name || "") }
            }
          ]
        }
      });
      
      if (!pendingRequestExists) {
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
