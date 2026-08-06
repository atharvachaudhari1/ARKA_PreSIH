import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid institutional email required" }, { status: 400 });
    }

    // Ensure it's an educational email (.edu, .ac.in, etc.)
    const lowerEmail = email.toLowerCase();
    if (!lowerEmail.endsWith(".edu") && !lowerEmail.endsWith(".ac.in") && !lowerEmail.endsWith(".edu.in")) {
      return NextResponse.json({ error: "Only institutional emails (.edu, .ac.in, .edu.in) are supported for automatic verification." }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.emailVerificationOTP.create({
      data: {
        user_id: user.id,
        email: lowerEmail,
        otp,
        expires_at: expiresAt
      }
    });

    if (process.env.RESEND_API_KEY) {
      const { error } = await resend.emails.send({
        from: "Verification <verify@teamup.arkalights.com>", // Replace with verified domain
        to: [lowerEmail],
        subject: "TeamUp Institutional Verification OTP",
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
      if (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
      }
    } else {
      // For development when RESEND_API_KEY is missing
      console.log(`[DEV MODE] OTP for ${lowerEmail} is ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("[POST /api/verify/send-otp]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
