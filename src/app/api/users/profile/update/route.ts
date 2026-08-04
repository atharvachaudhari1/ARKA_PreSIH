import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ContactVisibility } from "@prisma/client";

// ─── Helper: get authenticated user's DB profile ───────────────────────
async function getAuthProfile() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, profile: null, error: "Unauthorized" };
  const profile = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true, auth_user_id: true },
  });
  return { user, profile, error: null };
}

/**
 * PATCH /api/users/profile
 * Update the authenticated user's own profile.
 * All fields are optional — only provided fields are updated.
 * [GAP-RESOLVED-6] id_card_storage_path is never returned in the response.
 */
export async function PATCH(request: NextRequest) {
  const { user, profile, error: authErr } = await getAuthProfile();
  if (authErr || !user || !profile) {
    return NextResponse.json({ error: authErr ?? "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Validate gender if provided
  if (body.gender && !["male", "female"].includes(body.gender as string)) {
    return NextResponse.json({ error: "gender must be 'male' or 'female'" }, { status: 400 });
  }
  // Validate contact_visibility if provided
  const validVisibility = ["public_to_logged_in", "team_only", "private"];
  if (body.contact_visibility && !validVisibility.includes(body.contact_visibility as string)) {
    return NextResponse.json({ error: "Invalid contact_visibility value" }, { status: 400 });
  }
  // Clamp presentation_skill_rating 1–5
  if (body.presentation_skill_rating !== undefined) {
    const r = Number(body.presentation_skill_rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "presentation_skill_rating must be 1–5" }, { status: 400 });
    }
    body.presentation_skill_rating = r;
  }

  // Build safe update object (whitelist fields, never allow id_card_storage_path updates here)
  const updateData: Record<string, unknown> = {};
  const allowed = ["name", "gender", "college", "department", "bio", "past_hackathons_count",
    "presentation_skill_rating", "phone_number", "whatsapp_number", "linkedin_url", "contact_visibility"];
  for (const key of allowed) {
    if (key in body) updateData[key] = body[key];
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

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
      // id_card_storage_path intentionally excluded (GAP-RESOLVED-6)
    },
  });

  return NextResponse.json({ profile: updated });
}

/**
 * GET /api/users/profile — already defined in profile/route.ts
 * POST /api/users/profile — already defined in profile/route.ts
 */
export { GET, POST } from "./route";
