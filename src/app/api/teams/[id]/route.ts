import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id: id },
    include: {
      event: { select: { team_size_max: true, min_female_required: true } },
      slots: true,
      leader: {
        select: {
          id: true,
          name: true,
          college: true,
          phone_number: true,
          whatsapp_number: true,
          linkedin_url: true,
          github_url: true,
          portfolio_url: true,
          resume_storage_path: true,
          bio: true,
          preferred_contact_visibility: true,
          skills: { select: { skill: true } }
        },
      },
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              college: true,
              department: true,
              skills: { select: { skill: true, proficiency: true } },
              linkedin_url: true,
              github_url: true,
              portfolio_url: true,
              phone_number: true,
              whatsapp_number: true,
              preferred_contact_visibility: true,
              bio: true,
              resume_storage_path: true,
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
              college: true,
              department: true,
              skills: { select: { skill: true, proficiency: true } },
              linkedin_url: true,
              github_url: true,
              portfolio_url: true,
              phone_number: true,
              whatsapp_number: true,
              preferred_contact_visibility: true,
              bio: true,
              resume_storage_path: true,
            },
          },
        },
      },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Server-side visibility filtering
  const isTeammate = team.memberships.some(m => m.user_id === user.id);
  
  // Note: Leader contact and social links are always visible to logged-in users.
  // Delete visibility field from payload
  delete (team.leader as any).preferred_contact_visibility;

  // Filter Members
  team.memberships = team.memberships.map(m => {
    const isThisUserLeader = m.user.id === team.leader_id;
    // Teammate skills/github/linkedin/bio visible to teammates and applicants (everyone logged in who views the team)
    // But phone/whatsapp are private unless allowed, isTeammate, OR is the Leader
    if (!isTeammate && !isThisUserLeader) {
      if (m.user.preferred_contact_visibility !== "public_to_logged_in") {
        m.user.phone_number = null;
        m.user.whatsapp_number = null;
      }
    }
    delete (m.user as any).preferred_contact_visibility;
    return m;
  });

  return NextResponse.json({ team });
}

/**
 * PATCH /api/teams/[id]
 * Leader-only editing of team specifications: name, hackathon domain,
 * mission objective (description), and open member slots.
 * Filled slots are never modified or deleted.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true },
  });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { id } = await params;

  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  if (team.leader_id !== dbUser.id) {
    return NextResponse.json({ error: "Only the team leader can edit team specifications" }, { status: 403 });
  }
  if (team.status === "dissolved") {
    return NextResponse.json({ error: "Cannot edit a dissolved team" }, { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, description, domain_interest, slots } = body;

  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return NextResponse.json({ error: "Team name is required" }, { status: 400 });
  }
  if (description !== undefined && typeof description !== "string") {
    return NextResponse.json({ error: "Team description must be a string" }, { status: 400 });
  }
  if (domain_interest !== undefined && typeof domain_interest !== "string") {
    return NextResponse.json({ error: "Hackathon domain must be a string" }, { status: 400 });
  }

  let openSlots: { id?: string; role_title?: string; gender?: string; skills?: string[] }[] | null = null;
  if (slots !== undefined) {
    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
    }
    openSlots = slots;
    for (const s of slots) {
      if (s && typeof s === "object") {
        if (s.gender !== undefined && !["any", "male", "female"].includes(s.gender)) {
          return NextResponse.json({ error: "Invalid slot gender" }, { status: 400 });
        }
        if (s.skills !== undefined && !Array.isArray(s.skills)) {
          return NextResponse.json({ error: "Slot skills must be an array" }, { status: 400 });
        }
      }
    }

    // Enforce squad size: open slots cannot exceed capacity once filled slots are counted.
    const event = await prisma.event.findUnique({
      where: { id: team.event_id },
      select: { team_size_max: true },
    });
    const filledSlotsCount = await prisma.teamSlot.count({ where: { team_id: id, is_filled: true } });
    const maxOpenSlots = Math.max(0, (event?.team_size_max ?? 6) - filledSlotsCount);
    if (openSlots.length > maxOpenSlots) {
      return NextResponse.json({ error: `This team only has room for ${maxOpenSlots} more open slot(s).` }, { status: 400 });
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;
      if (domain_interest !== undefined) updateData.domain_interest = domain_interest;

      const updatedTeam = Object.keys(updateData).length > 0
        ? await tx.team.update({ where: { id }, data: updateData })
        : team;

      if (openSlots) {
        // Load current open slots so we only ever touch open slots.
        const existingOpen = await tx.teamSlot.findMany({
          where: { team_id: id, is_filled: false },
          select: { id: true },
        });
        const existingIds = existingOpen.map((s) => s.id);
        const submittedIds = openSlots.filter((s) => s.id).map((s) => s.id as string);

        // Delete open slots that are no longer listed.
        const toDelete = existingIds.filter((eid) => !submittedIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.teamSlot.deleteMany({ where: { id: { in: toDelete } } });
        }

        // Upsert submitted slots (existing are edited, new ones are created).
        for (const slot of openSlots) {
          const data = {
            role_title: slot.role_title || "Open Position",
            gender: slot.gender || "any",
            skills: Array.isArray(slot.skills) ? slot.skills : [],
            is_filled: false,
          };
          if (slot.id && existingIds.includes(slot.id)) {
            await tx.teamSlot.update({ where: { id: slot.id }, data });
          } else if (!slot.id) {
            await tx.teamSlot.create({ data: { team_id: id, ...data } });
          }
        }

        // Recompute skills_needed from the final set of open slots.
        const currentOpen = await tx.teamSlot.findMany({
          where: { team_id: id, is_filled: false },
          select: { skills: true },
        });
        const skillsNeeded = Array.from(new Set(currentOpen.flatMap((s) => s.skills)));
        await tx.team.update({ where: { id }, data: { skills_needed: skillsNeeded } });
      }

      return updatedTeam;
    });

    return NextResponse.json({ team: updated });
  } catch (err: any) {
    if (err?.code === "P2002" && err?.meta?.target?.includes("name")) {
      return NextResponse.json({ error: `A team named "${name ?? ""}" already exists. Please choose a different team name.` }, { status: 409 });
    }
    console.error("[PATCH /api/teams/[id]] Unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update team" }, { status: 500 });
  }
}
