import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { OUTCOME_NOTIFICATION_TYPES } from "@/lib/notificationOutcome";
import { NextResponse } from "next/server";

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Outcome notifications (request_accepted, request_rejected, ...) are one-time
  // status updates. Marking everything as read means they should disappear from
  // the feed entirely — delete them from the table.
  await prisma.notification.deleteMany({
    where: {
      user_id: currentUser.id,
      type: { in: [...OUTCOME_NOTIFICATION_TYPES] },
    },
  });

  // Mark remaining (actionable) notifications as read.
  await prisma.notification.updateMany({
    where: { user_id: currentUser.id, read_status: "unread" },
    data: { read_status: "read" }
  });

  return NextResponse.json({ success: true });
}
