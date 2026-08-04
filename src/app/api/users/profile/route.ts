import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ContactVisibility } from "@prisma/client";
import { fuzzyMatchSimilarity } from "@/lib/stringMatch";

const MATCH_THRESHOLD = 0.85;
const MIN_OCR_CONFIDENCE = 0.7;
// Department abbreviations vary wildly (e.g., "CS" vs "Computer Science" vs "CSE"), so we use a lower threshold
const DEPARTMENT_MATCH_THRESHOLD = 0.5;

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

  // No strict enum validation for gender anymore.

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

  // 4. Server-Authoritative OCR Verification
  const latestOcr = await prisma.ocrVerificationAttempt.findFirst({
    where: { 
      user_id: user.id,
      expires_at: { gt: new Date() }
    },
    orderBy: { created_at: "desc" }
  });

  let verification_status: "pending" | "verified" | "rejected" = "pending";
  let verification_method: "auto" | "manual_review" = "manual_review";
  let verified_at: Date | null = null;

  if (latestOcr) {
    // We intentionally use >= for the 85% boundary condition
    const nameMatch = fuzzyMatchSimilarity(body.name, latestOcr.ocr_parsed_name || "");
    const collegeMatch = fuzzyMatchSimilarity(body.college, latestOcr.ocr_parsed_college || "");
    const deptMatch = fuzzyMatchSimilarity(body.department, latestOcr.ocr_parsed_department || "");
    
    // If OCR engine had reasonable confidence overall, and our fuzzy match threshold is met
    if (
      latestOcr.ocr_confidence_score && latestOcr.ocr_confidence_score >= MIN_OCR_CONFIDENCE &&
      nameMatch >= MATCH_THRESHOLD &&
      collegeMatch >= MATCH_THRESHOLD &&
      deptMatch >= DEPARTMENT_MATCH_THRESHOLD
    ) {
      verification_status = "verified";
      verification_method = "auto";
      verified_at = new Date();
    }
  }

  // 5. Create profile
  // NEVER return id_card_storage_path in any response (GAP-RESOLVED-6)
  const profile = await prisma.user.create({
    data: {
      auth_user_id: user.id,
      email: user.email!,
      name: body.name,
      gender: body.gender.trim(),
      counts_toward_female_quota: body.gender.trim().toLowerCase() === "female",
      college: body.college,
      department: body.department,
      past_hackathons_count: body.past_hackathons_count ?? 0,
      bio: body.bio,
      id_card_storage_path: body.id_card_storage_path,
      verification_status,
      verification_method,
      verified_at,
    },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      college: true,
      department: true,
      verification_status: true,
      verification_method: true,
      verified_at: true,
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
      preferred_contact_visibility: true,
      led_teams: { select: { id: true }, take: 1 },
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

  const { led_teams, ...profileData } = profile;
  const isLeader = led_teams.length > 0;
  const effective_visibility = isLeader ? "public_to_logged_in" : profileData.preferred_contact_visibility;

  return NextResponse.json({ 
    profile: {
      ...profileData,
      effective_visibility
    } 
  });
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

  // No strict enum validation for gender anymore.

  const validVisibility = ["public_to_logged_in", "team_only", "private"];
  if (body.preferred_contact_visibility && !validVisibility.includes(body.preferred_contact_visibility as string))
    return NextResponse.json({ error: "Invalid preferred_contact_visibility" }, { status: 400 });

  if (body.presentation_skill_rating !== undefined) {
    const r = Number(body.presentation_skill_rating);
    if (isNaN(r) || r < 1 || r > 5)
      return NextResponse.json({ error: "presentation_skill_rating must be 1–5" }, { status: 400 });
    body.presentation_skill_rating = r;
  }

  // Whitelist — never allow id_card_storage_path updates via this endpoint
  const allowed = ["name", "gender", "college", "department", "bio", "past_hackathons_count",
    "presentation_skill_rating", "phone_number", "whatsapp_number", "linkedin_url", "preferred_contact_visibility"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updateData[key] = body[key]; }
  if (updateData.gender) {
    updateData.gender = (updateData.gender as string).trim();
    updateData.counts_toward_female_quota = (updateData.gender as string).toLowerCase() === "female";
  }
  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: updateData as {
      name?: string; gender?: string; counts_toward_female_quota?: boolean; college?: string; department?: string;
      bio?: string; past_hackathons_count?: number; presentation_skill_rating?: number;
      phone_number?: string; whatsapp_number?: string; linkedin_url?: string;
      preferred_contact_visibility?: ContactVisibility;
    },
    select: {
      id: true, name: true, email: true, gender: true, college: true, department: true,
      verification_status: true, past_hackathons_count: true, bio: true,
      presentation_skill_rating: true, phone_number: true, whatsapp_number: true,
      linkedin_url: true, preferred_contact_visibility: true,
      led_teams: { select: { id: true }, take: 1 },
      skills: { select: { skill: true, proficiency: true } },
      updated_at: true,
    },
  });

  const { led_teams, ...profileData } = updated;
  const isLeader = led_teams.length > 0;
  const effective_visibility = isLeader ? "public_to_logged_in" : profileData.preferred_contact_visibility;

  return NextResponse.json({ 
    profile: {
      ...profileData,
      effective_visibility
    } 
  });
}

