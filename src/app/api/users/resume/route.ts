import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // 2MB limit
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Resume exceeds 2MB limit." }, { status: 400 });
    }

    // Read the first few bytes for magic number validation
    const buffer = await file.arrayBuffer();
    const header = new Uint8Array(buffer).subarray(0, 5);
    const magic = String.fromCharCode(...header);
    
    if (magic !== "%PDF-") {
      return NextResponse.json({ error: "Invalid file type. Only genuine PDF files are allowed." }, { status: 400 });
    }

    // Upload to Supabase Storage using Service Role Key to bypass RLS policies
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileName = `${user.id}-${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume to storage." }, { status: 500 });
    }

    // Optionally update user profile if it already exists, otherwise the client
    // will pass the returned path to /api/users/profile on creation.
    const currentUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
    });
    if (currentUser) {
      await prisma.user.update({
        where: { id: currentUser.id },
        data: { resume_storage_path: fileName }
      });
    }

    return NextResponse.json({ success: true, path: fileName });
  } catch (err: any) {
    console.error("[POST /api/users/resume]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET route to serve the resume (since bucket is private)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    
    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // In a real app we might verify if the current user has access to view this specific resume
    // Since team pages use this URL, anyone logged in can view it if the UI gives them the path.
    // Using Service Role Key to bypass RLS policies since resumes bucket is private and lacks anon RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(path, 60);

    if (error || !data) {
      return NextResponse.json({ error: "Failed to generate resume link" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (err: any) {
    console.error("[GET /api/users/resume]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
