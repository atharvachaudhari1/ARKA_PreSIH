import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
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

    if (status !== "resolved" && status !== "dismissed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await prisma.report.update({
      where: { id: params.reportId },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/reports/[reportId]] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
