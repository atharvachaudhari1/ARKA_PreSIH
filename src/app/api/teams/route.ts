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
  const skillsNeeded = url.searchParams.getAll("skills_needed[]");

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

  try {
    const teams = await prisma.team.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        slots: true,
        leader: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            whatsapp_number: true,
            linkedin_url: true,
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
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ teams });
  } catch (err) {
    console.error("[GET /api/teams] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { auth_user_id: authUser.id },
      select: { id: true, counts_toward_female_quota: true, team_memberships: { select: { id: true } } },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "User profile not found. Please complete your profile first." }, { status: 404 });
    }
    if (currentUser.team_memberships.length > 0) {
      return NextResponse.json({ error: "You are already in a team. You must leave your current team before creating a new one." }, { status: 400 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, description, domain_interest, skills_needed, min_experience_required, succession_mode, event_id, slots } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    let event;
    if (event_id) {
      event = await prisma.event.findUnique({ where: { id: event_id } });
      if (!event) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    } else {
      event = await getDefaultEvent();
    }

    // Compute initial needed female count from the old logic (can still keep it for simplicity)
    const initialFemaleCount = currentUser.counts_toward_female_quota ? 1 : 0;
    const neededFemaleCount = Math.max(0, event.min_female_required - initialFemaleCount);

    if (Array.isArray(slots) && slots.length > (event.team_size_max - 1)) {
      return NextResponse.json({ error: `You can only define up to ${event.team_size_max - 1} open slots for this event.` }, { status: 400 });
    }

    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name: name.trim(),
          description: description ?? null,
          domain_interest: domain_interest || null,
          skills_needed: Array.isArray(skills_needed) ? skills_needed : [],
          min_experience_required: min_experience_required != null ? parseInt(min_experience_required, 10) : null,
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
      
      // Create a filled slot for the leader
      await tx.teamSlot.create({
        data: {
          team_id: team.id,
          role_title: "Team Leader",
          gender: "any",
          skills: [],
          is_filled: true,
          filled_by_user_id: currentUser.id
        }
      });

      if (Array.isArray(slots) && slots.length > 0) {
        for (const slot of slots) {
          await tx.teamSlot.create({
            data: {
              team_id: team.id,
              role_title: slot.role_title || "Open Position",
              gender: slot.gender || "any",
              skills: Array.isArray(slot.skills) ? slot.skills : [],
              is_filled: false
            }
          });
        }
      }

      // Force leader's contact visibility to public_to_logged_in
      // FIX: field name is preferred_contact_visibility, not contact_visibility
      await tx.user.update({
        where: { id: currentUser.id },
        data: { preferred_contact_visibility: "public_to_logged_in" },
      });

      return team;
    });

    return NextResponse.json({ team: newTeam }, { status: 201 });
  } catch (err: any) {
    // Catch ALL unhandled exceptions so we ALWAYS return JSON — never an HTML 500 page.
    console.error("[POST /api/teams] Unhandled error:", err);
    const message = err?.message ?? "Failed to create team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
