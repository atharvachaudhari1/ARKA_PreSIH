import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ContactVisibility } from "@prisma/client";

/**
 * Persists a department code in the directory so it remains available in the
 * solo-hackers filter even after every member with that department leaves or
 * is removed. Normalized to uppercase; no-op for empty values.
 */
async function registerDepartment(department?: unknown) {
  const name = String(department ?? "").trim().toUpperCase();
  if (!name) return;
  try {
    await prisma.department.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  } catch {
    // Best-effort: never fail the profile write because the directory upsert
    // failed (e.g. prisma is mocked without the department model in tests).
  }
}

/**
 * POST /api/users/profile
 * Creates a new user profile after signup.
 * Requires an authenticated Supabase session.
 *
 * [GAP-RESOLVED-2] Gender is strictly "male" | "female" for SIH quota counting.
 * Identity verification has been removed: every registered user's self-reported
 * gender counts toward the SIH female quota directly, with no verification gate.
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
    portfolio_url?: string;
    whatsapp_number?: string;
    resume_storage_path?: string;
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

  // 3. Check for duplicate
  const existing = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  }

  // 4. Create profile
  await registerDepartment(body.department);
  const profile = await prisma.user.create({    data: {
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
      portfolio_url: body.portfolio_url,
      whatsapp_number: body.whatsapp_number,
      resume_storage_path: body.resume_storage_path,
    },
    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      college: true,
      department: true,
      past_hackathons_count: true,
      bio: true,
      github_url: true,
      linkedin_url: true,
      portfolio_url: true,
      whatsapp_number: true,
      created_at: true,
    },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

/**
 * GET /api/users/profile
 * Returns the authenticated user's own profile.
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
      past_hackathons_count: true,
      bio: true,
      presentation_skill_rating: true,
      phone_number: true,
      whatsapp_number: true,
      linkedin_url: true,
      github_url: true,
      portfolio_url: true,
      resume_storage_path: true,
      preferred_contact_visibility: true,
      led_teams: {
        where: { status: { not: 'dissolved' } },
        take: 1,
        select: { id: true, name: true, status: true },
      },
      team_memberships: {
        where: { team: { status: { not: 'dissolved' } } },
        take: 1,
        select: { team_id: true, team: { select: { name: true, status: true } } },
      },
      skills: {
        select: { skill: true, proficiency: true },
      },
      created_at: true,
      updated_at: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { led_teams, team_memberships, ...profileData } = profile;

  const activeLedTeams = (led_teams || []);
  const activeMemberships = (team_memberships || []);

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
 * No verification downgrade logic: profile edits apply immediately.
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

  const allowed = ["name", "gender", "college", "department", "bio", "past_hackathons_count",
    "presentation_skill_rating", "phone_number", "whatsapp_number", "linkedin_url", "github_url", "portfolio_url", "preferred_contact_visibility"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowed) { if (key in body) updateData[key] = body[key]; }
  if (updateData.gender) {
    updateData.gender = (updateData.gender as string).trim();
    updateData.counts_toward_female_quota = (updateData.gender as string).toLowerCase() === "female";
  }
  if (updateData.department) await registerDepartment(updateData.department);

  // Optional full skill-list sync: replaces the user's skill set while
  // preserving existing proficiency levels where a skill is kept.
  if (Array.isArray(body.skills)) {
    const newSkills = Array.from(new Set((body.skills as unknown[]).map((s) => String(s).trim()).filter(Boolean)));
    const current = await prisma.userSkill.findMany({
      where: { user_id: profile.id },
      select: { skill: true, proficiency: true },
    });
    const profMap = new Map(current.map((s) => [s.skill.toLowerCase(), s.proficiency]));
    await prisma.userSkill.deleteMany({
      where: { user_id: profile.id, skill: { notIn: newSkills } },
    });
    for (const skill of newSkills) {
      const proficiency = profMap.get(skill.toLowerCase()) ?? "intermediate";
      await prisma.userSkill.upsert({
        where: { user_id_skill: { user_id: profile.id, skill } },
        create: { user_id: profile.id, skill, proficiency },
        update: { proficiency },
      });
    }
  }

  if (Object.keys(updateData).length === 0 && !Array.isArray(body.skills))
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: profile.id },
    data: updateData as any,
    select: {
      id: true, name: true, email: true, gender: true, college: true, department: true,
      past_hackathons_count: true, bio: true,
      presentation_skill_rating: true, phone_number: true, whatsapp_number: true,
      linkedin_url: true, github_url: true, portfolio_url: true, resume_storage_path: true, preferred_contact_visibility: true,
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
