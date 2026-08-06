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
    github_url?: string;
    linkedin_url?: string;
    whatsapp_number?: string;
    id_card_storage_path: string;
    resume_storage_path?: string;
    intent?: "join" | "create";
    ocr_data?: {
      score: number;
      parsed_name: string | null;
      parsed_college: string | null;
      parsed_department: string | null;
    };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.gender || !body.college || !body.department || !body.bio || !body.whatsapp_number) {
    return NextResponse.json({ error: "Missing required fields: name, gender, college, department, bio, WhatsApp number" }, { status: 400 });
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

  // Every ID upload requires manual review (Path B)
  let verification_status: "pending" | "verified" | "rejected" = "pending";
  let verification_method: "auto" | "manual_review" = "manual_review";
  let verified_at: Date | null = null;

  // 4. Create profile
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
      github_url: body.github_url,
      linkedin_url: body.linkedin_url,
      whatsapp_number: body.whatsapp_number,
      id_card_storage_path: body.id_card_storage_path,
      resume_storage_path: body.resume_storage_path,
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
      github_url: true,
      linkedin_url: true,
      whatsapp_number: true,
      created_at: true,
      // id_card_storage_path is intentionally excluded (GAP-RESOLVED-6)
    },
  });

  if (body.ocr_data) {
    await prisma.ocrVerificationAttempt.create({
      data: {
        user_id: profile.id,
        ocr_parsed_name: body.ocr_data.parsed_name,
        ocr_parsed_college: body.ocr_data.parsed_college,
        ocr_parsed_department: body.ocr_data.parsed_department,
        ocr_confidence_score: body.ocr_data.score,
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // Keep for 1 year audit
      }
    });
  }

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
      github_url: true,
      resume_storage_path: true,
      preferred_contact_visibility: true,
      led_teams: { select: { id: true, name: true, status: true } },
      team_memberships: { select: { team_id: true, team: { select: { name: true, status: true } } } },
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

  const { led_teams, team_memberships, ...profileData } = profile;
  
  const activeLedTeams = (led_teams || []).filter((t: any) => t.status !== 'dissolved').slice(0, 1);
  const activeMemberships = (team_memberships || []).filter((m: any) => m?.team?.status !== 'dissolved').slice(0, 1);
  
  const pastLedTeams = (led_teams || []).filter((t: any) => t.status === 'dissolved').map((t: any) => ({ id: t.id, name: t.name, role: 'leader' }));
  const pastMemberTeams = (team_memberships || []).filter((m: any) => m?.team?.status === 'dissolved' && !pastLedTeams.some(plt => plt.id === m.team_id)).map((m: any) => ({ id: m.team_id, name: m?.team?.name, role: 'member' }));
  const past_teams = [...pastLedTeams, ...pastMemberTeams];

  const isLeader = activeLedTeams.length > 0;
  const effective_visibility = isLeader ? "public_to_logged_in" : profileData.preferred_contact_visibility;

  return NextResponse.json({ 
    profile: {
      ...profileData,
      led_teams: activeLedTeams,
      team_memberships: activeMemberships,
      past_teams,
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
    select: { id: true, name: true, college: true, department: true, verification_status: true },
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
    "presentation_skill_rating", "phone_number", "whatsapp_number", "linkedin_url", "github_url", "preferred_contact_visibility"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updateData[key] = body[key]; }
  if (updateData.gender) {
    updateData.gender = (updateData.gender as string).trim();
    updateData.counts_toward_female_quota = (updateData.gender as string).toLowerCase() === "female";
  }
  if (Object.keys(updateData).length === 0)
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

  let newStatus = undefined;
  if (profile.verification_status === "verified") {
    if (
      (updateData.name && updateData.name !== profile.name) ||
      (updateData.college && updateData.college !== profile.college) ||
      (updateData.department && updateData.department !== profile.department)
    ) {
      newStatus = "pending";
    }
  }

  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: {
      ...(updateData as any),
      ...(newStatus ? { verification_status: newStatus } : {})
    },
    select: {
      id: true, name: true, email: true, gender: true, college: true, department: true,
      verification_status: true, past_hackathons_count: true, bio: true,
      presentation_skill_rating: true, phone_number: true, whatsapp_number: true,
      linkedin_url: true, github_url: true, resume_storage_path: true, preferred_contact_visibility: true,
      led_teams: { select: { id: true, name: true, status: true } },
      team_memberships: { select: { team_id: true, team: { select: { name: true, status: true } } } },
      skills: { select: { skill: true, proficiency: true } },
      updated_at: true,
    },
  });

  const { led_teams, team_memberships, ...profileData } = updated;
  const activeLedTeams = (led_teams || []).filter((t: any) => t.status !== 'dissolved').slice(0, 1);
  const activeMemberships = (team_memberships || []).filter((m: any) => m?.team?.status !== 'dissolved').slice(0, 1);
  
  const pastLedTeams = (led_teams || []).filter((t: any) => t.status === 'dissolved').map((t: any) => ({ id: t.id, name: t.name, role: 'leader' }));
  const pastMemberTeams = (team_memberships || []).filter((m: any) => m?.team?.status === 'dissolved' && !pastLedTeams.some(plt => plt.id === m.team_id)).map((m: any) => ({ id: m.team_id, name: m?.team?.name, role: 'member' }));
  const past_teams = [...pastLedTeams, ...pastMemberTeams];

  const isLeader = activeLedTeams.length > 0;
  const effective_visibility = isLeader ? "public_to_logged_in" : profileData.preferred_contact_visibility;

  return NextResponse.json({ 
    profile: {
      ...profileData,
      led_teams: activeLedTeams,
      team_memberships: activeMemberships,
      past_teams,
      effective_visibility
    } 
  });
}

