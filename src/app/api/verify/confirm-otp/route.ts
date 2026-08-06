import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    // Find the latest valid OTP
    const otpRecord = await prisma.emailVerificationOTP.findFirst({
      where: {
        user_id: user.id,
        email: lowerEmail,
      },
      orderBy: { created_at: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (otpRecord.expires_at < new Date()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP." }, { status: 400 });
    }

    // OTP is valid. Mark user as verified.
    await prisma.$transaction([
      prisma.user.update({
        where: { id: otpRecord.user_id },
        data: {
          verification_status: "verified",
          verification_method: "auto"
        }
      }),
      // Delete all OTPs for this user to prevent reuse
      prisma.emailVerificationOTP.deleteMany({
        where: { user_id: otpRecord.user_id }
      })
    ]);

    return NextResponse.json({ success: true, message: "Email verified successfully!" });
  } catch (err) {
    console.error("[POST /api/verify/confirm-otp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
