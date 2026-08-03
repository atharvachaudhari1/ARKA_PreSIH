import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Gender, ContactVisibility } from "@prisma/client";

/**
 * POST /api/users/profile
 * Creates a new user profile after signup.
 * Requires an authenticated Supabase session.
 *
 * [GAP-RESOLVED-6] id_card_storage_path is accepted but NEVER returned in any API response.
 * [GAP-RESOLVED-2] Gender is strictly "male" | "female".
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse + validate body
  let body: {
    name: string;
    gender: string;
    college: string;
    department: string;
    past_hackathons_count: number;
    bio?: string;
    id_card_storage_path: string;
    intent?: "join" | "create";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.gender || !body.college || !body.department) {
    return NextResponse.json({ error: "Missing required fields: name, gender, college, department" }, { status: 400 });
  }

  if (!["male", "female"].includes(body.gender)) {
    return NextResponse.json({ error: "gender must be 'male' or 'female'" }, { status: 400 });
  }

  if (!body.id_card_storage_path) {
    return NextResponse.json({ error: "id_card_storage_path is required" }, { status: 400 });
  }

  // 3. Check for duplicate
  const existing = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  // 4. Create profile
  // NEVER return id_card_storage_path in any response (GAP-RESOLVED-6)
  const profile = await prisma.user.create({
    data: {
      auth_user_id: user.id,
      email: user.email!,
      name: body.name,
      gender: body.gender as Gender,
      college: body.college,
      department: body.department,
      past_hackathons_count: body.past_hackathons_count ?? 0,
      bio: body.bio,
      id_card_storage_path: body.id_card_storage_path,
      verification_status: "pending",
    },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      college: true,
      department: true,
      verification_status: true,
      past_hackathons_count: true,
      bio: true,
      created_at: true,
      // id_card_storage_path is intentionally excluded (GAP-RESOLVED-6)
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

/**
 * GET /api/users/profile
 * Returns the authenticated user's own profile (excluding id_card_storage_path).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      college: true,
      department: true,
      verification_status: true,
      past_hackathons_count: true,
      bio: true,
      presentation_skill_rating: true,
      phone_number: true,
      whatsapp_number: true,
      linkedin_url: true,
      contact_visibility: true,
      skills: {
        select: { skill: true, proficiency: true },
      },
      created_at: true,
      updated_at: true,
      // id_card_storage_path is intentionally excluded (GAP-RESOLVED-6)
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

/**
 * PATCH /api/users/profile
 * Update the authenticated user's own profile.
 * [GAP-RESOLVED-6] id_card_storage_path is never returned in the response.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (body.gender && !["male", "female"].includes(body.gender as string))
    return NextResponse.json({ error: "gender must be 'male' or 'female'" }, { status: 400 });

  const validVisibility = ["public_to_logged_in", "team_only", "private"];
  if (body.contact_visibility && !validVisibility.includes(body.contact_visibility as string))
    return NextResponse.json({ error: "Invalid contact_visibility" }, { status: 400 });

  if (body.presentation_skill_rating !== undefined) {
    const r = Number(body.presentation_skill_rating);
    if (isNaN(r) || r < 1 || r > 5)
      return NextResponse.json({ error: "presentation_skill_rating must be 1–5" }, { status: 400 });
    body.presentation_skill_rating = r;
  }

  // Whitelist — never allow id_card_storage_path updates via this endpoint
  const allowed = ["name", "gender", "college", "department", "bio", "past_hackathons_count",
    "presentation_skill_rating", "phone_number", "whatsapp_number", "linkedin_url", "contact_visibility"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updateData[key] = body[key]; }
  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: updateData as {
      name?: string; gender?: Gender; college?: string; department?: string;
      bio?: string; past_hackathons_count?: number; presentation_skill_rating?: number;
      phone_number?: string; whatsapp_number?: string; linkedin_url?: string;
      contact_visibility?: ContactVisibility;
    },
    select: {
      id: true, name: true, email: true, gender: true, college: true, department: true,
      verification_status: true, past_hackathons_count: true, bio: true,
      presentation_skill_rating: true, phone_number: true, whatsapp_number: true,
      linkedin_url: true, contact_visibility: true,
      skills: { select: { skill: true, proficiency: true } },
      updated_at: true,
    },
  });

  return NextResponse.json({ profile: updated });
}

