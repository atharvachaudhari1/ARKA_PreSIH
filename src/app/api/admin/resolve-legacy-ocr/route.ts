import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { auth_user_id: user.id } });
  if (!admin || !admin.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Revert users stuck in pending back to their initial unverified state so they use the new flows.
    const result = await prisma.user.updateMany({
      where: { verification_status: "pending", verification_method: "auto" },
      data: { verification_status: "pending", verification_method: null } // Force them to re-verify on next login
    });

    return NextResponse.json({ 
      success: true, 
      message: `Reset ${result.count} legacy pending users to unverified state.` 
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
