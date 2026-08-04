import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // Check admin authorization
    const adminUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
      select: { is_admin: true }
    });

    if (!adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Fetch target user's storage path
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id_card_storage_path: true }
    });

    if (!targetUser || !targetUser.id_card_storage_path) {
      return NextResponse.json({ error: "User or ID card not found" }, { status: 404 });
    }

    // Generate short-lived signed URL (e.g., 5 minutes)
    const { data: signedUrlData, error: signedUrlErr } = await supabase.storage
      .from("id-cards")
      .createSignedUrl(targetUser.id_card_storage_path, 60 * 5); // 300 seconds

    if (signedUrlErr || !signedUrlData?.signedUrl) {
      console.error("[Admin ID Card View] Error generating signed URL:", signedUrlErr);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: signedUrlData.signedUrl });

  } catch (error) {
    console.error("[GET /api/admin/verifications/[userId]/id-card] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
