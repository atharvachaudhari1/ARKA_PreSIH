import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
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
  const skillsNeeded = url.searchParams.getAll("skills_needed[]");
  const searchQuery = url.searchParams.get("search");

  const where: any = {};
  if (status && (status === "open" || status === "full")) {
    where.status = status;
  } else {
    // Never show dissolved teams unless explicitly filtered
    where.status = { not: "dissolved" };
  }
  if (domain) {
    where.domain_interest = domain;
  }
  if (genderNeed === "true") {
    where.needed_female_count = { gt: 0 };
  }
  if (skillsNeeded.length > 0) {
    where.skills_needed = { hasSome: skillsNeeded };
  }
  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { leader: { name: { contains: searchQuery, mode: 'insensitive' } } },
      { memberships: { some: { user: { name: { contains: searchQuery, mode: 'insensitive' } } } } }
    ];
  }

  try {
    const teams = await prisma.team.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        event: { select: { team_size_max: true, min_female_required: true } },
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
                skills: { select: { skill: true, proficiency: true } },
              },
            },
          },
        },
        join_requests: {
          where: {
            direction: "team_to_user",
            status: "pending",
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                department: true,
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
      select: { id: true, counts_toward_female_quota: true, team_memberships: { where: { team: { status: { not: 'dissolved' } } }, select: { id: true } } },
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

    const { name, description, domain_interest, skills_needed, succession_mode, event_id, slots, leaderBio, leaderSkills } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Team description is required" }, { status: 400 });
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

          if (slot.prefill_user_id) {
            // Create a pending invite (team_to_user) instead of direct membership
            await tx.joinRequest.create({
              data: {
                team_id: team.id,
                requester_id: slot.prefill_user_id,
                direction: "team_to_user",
                status: "pending"
              }
            });

            // Notify the invited user in-app
            await tx.notification.create({
              data: {
                user_id: slot.prefill_user_id,
                team_id: team.id,
                type: "new_join_request",
                payload: { message: `You have been invited to join the new team: ${name.trim()}` }
              }
            });
            
            // Send email notification
            const invitedUser = await tx.user.findUnique({
              where: { id: slot.prefill_user_id },
              select: { email: true }
            });

            if (invitedUser?.email) {
              await sendEmail({
                to: invitedUser.email,
                subject: "You've been invited to a team!",
                html: `<p>Hello!</p><p>You have been invited to join the team <strong>${name.trim()}</strong> on TeamUp.</p><p>Log in to your dashboard to view and accept the invitation.</p>`
              });
            }
          }
        }
      }

      // Force leader's contact visibility to public_to_logged_in
      await tx.user.update({
        where: { id: currentUser.id },
        data: { 
          preferred_contact_visibility: "public_to_logged_in",
          ...(leaderBio ? { bio: leaderBio } : {})
        },
      });

      if (Array.isArray(leaderSkills) && leaderSkills.length > 0) {
        await tx.userSkill.deleteMany({ where: { user_id: currentUser.id } });
        await tx.userSkill.createMany({
          data: leaderSkills.map((skill: string) => ({
            user_id: currentUser.id,
            skill,
            proficiency: "intermediate"
          })),
          skipDuplicates: true
        });
      }

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
