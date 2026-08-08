import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isOutcomeNotificationType } from "@/lib/notificationOutcome";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notifId = (await params).id;
  const notification = await prisma.notification.findUnique({
    where: { id: notifId }
  });

  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  if (notification.user_id !== currentUser.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Outcome notifications (request_accepted, request_rejected, ...) are one-time
  // status updates. Once read, they are deleted from the table so they never
  // linger in the "read" section of the feed.
  if (isOutcomeNotificationType(notification.type)) {
    const deleted = await prisma.notification.delete({
      where: { id: notifId },
    });
    return NextResponse.json({ notification: deleted, removed: true });
  }

  const updated = await prisma.notification.update({
    where: { id: notifId },
    data: { read_status: "read" }
  });

  return NextResponse.json({ notification: updated, removed: false });
}
