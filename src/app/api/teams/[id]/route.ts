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
