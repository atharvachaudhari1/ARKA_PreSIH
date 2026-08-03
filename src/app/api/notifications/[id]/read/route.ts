import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const notifId = String(params.id);
  const notification = await prisma.notification.findUnique({
    where: { id: notifId }
  });

  if (!notification) return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  if (notification.user_id !== currentUser.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.notification.update({
    where: { id: notifId },
    data: { read_status: "read" }
  });

  return NextResponse.json({ notification: updated });
}
