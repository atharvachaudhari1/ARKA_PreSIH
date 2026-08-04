import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
      select: { is_admin: true }
    });

    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (status !== "verified" && status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        verification_status: status,
        verification_method: "manual_review",
        verified_at: status === "verified" ? new Date() : null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/verifications/[userId]] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
