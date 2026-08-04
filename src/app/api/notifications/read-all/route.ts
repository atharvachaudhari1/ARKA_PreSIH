import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH() {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.notification.updateMany({
    where: { user_id: currentUser.id, read_status: "unread" },
    data: { read_status: "read" }
  });

  return NextResponse.json({ success: true });
}
