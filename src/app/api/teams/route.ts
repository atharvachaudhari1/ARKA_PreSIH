import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { SuccessionMode } from "@prisma/client";

// Helper to get or create the default event
async function getDefaultEvent() {
  let event = await prisma.event.findFirst({
    where: { name: "SIH 2026" },
  });
  if (!event) {
    event = await prisma.event.create({
      data: {
        name: "SIH 2026",
        team_size_max: 6,
        min_female_required: 1,
        themes: ["Web3", "Healthcare", "FinTech", "EdTech", "Smart Automation", "Agriculture", "Miscellaneous"],
      },
    });
  }
  return event;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const status = url.searchParams.get("status");
  const domain = url.searchParams.get("domain");
  const genderNeed = url.searchParams.get("gender_need");
  const minExperience = url.searchParams.get("min_experience");
  const skillsNeeded = url.searchParams.getAll("skills_needed[]"); // multiple skills

  const where: any = {};
  if (status && (status === "open" || status === "full")) {
    where.status = status;
  }
  if (domain) {
    where.domain_interest = domain;
  }
  if (genderNeed === "true") {
    where.needed_female_count = { gt: 0 };
  }
  if (minExperience) {
    where.min_experience_required = { lte: parseInt(minExperience, 10) };
  }
  if (skillsNeeded.length > 0) {
    where.skills_needed = { hasSome: skillsNeeded };
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      leader: {
        select: {
          id: true,
          name: true,
          phone_number: true,
          whatsapp_number: true,
          linkedin_url: true,
          // Leader's contact is public to logged in users (enforced by design)
        },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true,
              verification_status: true,
              skills: { select: { skill: true, proficiency: true } },
              // Exclude non-leader contact info strictly
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    select: { id: true, counts_toward_female_quota: true },
  });
  if (!currentUser) return NextResponse.json({ error: "User profile not found" }, { status: 404 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, domain_interest, skills_needed, min_experience_required, succession_mode } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }

  const event = await getDefaultEvent();

  // Compute initial needed female count
  // If the creator is female (counts towards quota), they satisfy 1 spot
  const initialFemaleCount = currentUser.counts_toward_female_quota ? 1 : 0;
  const neededFemaleCount = Math.max(0, event.min_female_required - initialFemaleCount);

  const newTeam = await prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name,
        description,
        domain_interest,
        skills_needed: Array.isArray(skills_needed) ? skills_needed : [],
        min_experience_required: min_experience_required ? parseInt(min_experience_required, 10) : null,
        succession_mode: (succession_mode as SuccessionMode) || "manual",
        event_id: event.id,
        leader_id: currentUser.id,
        needed_female_count: neededFemaleCount,
        status: "open",
      },
    });

    await tx.teamMembership.create({
      data: {
        team_id: team.id,
        user_id: currentUser.id,
        role: "leader",
      },
    });

    // Force leader's contact visibility to public_to_logged_in
    await tx.user.update({
      where: { id: currentUser.id },
      data: { contact_visibility: "public_to_logged_in" },
    });

    return team;
  });

  return NextResponse.json({ team: newTeam }, { status: 201 });
}
