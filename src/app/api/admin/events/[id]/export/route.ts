import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id }
  });

  if (!currentUser || !currentUser.is_admin) {
    return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      teams: {
        include: {
          memberships: {
            include: { user: true },
            orderBy: { joined_at: "asc" }
          },
          leader: true
        }
      }
    }
  });

  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  // Filter for "finalized" teams: full size + female quota met
  const finalizedTeams = event.teams.filter((team) => {
    if (team.memberships.length !== event.team_size_max) return false;
    
    const verifiedFemaleCount = team.memberships.filter(
      (m: any) => m.user.counts_toward_female_quota && m.user.verification_status === "verified"
    ).length;

    if (verifiedFemaleCount < event.min_female_required) return false;
    
    return true;
  });

  // Generate CSV payload
  // Columns: Team ID, Team Name, Leader Name, Leader Email, Leader Phone, Member 2 Name, Member 2 Email, ..., Member N Name, Member N Email
  let maxMembers = event.team_size_max;
  
  let headerRow = ["Team ID", "Team Name", "Leader Name", "Leader Email", "Leader Phone", "Leader College"];
  for (let i = 2; i <= maxMembers; i++) {
    headerRow.push(`Member ${i} Name`, `Member ${i} Email`, `Member ${i} College`);
  }
  
  let csvContent = headerRow.join(",") + "\n";
  
  for (const team of finalizedTeams) {
    let row = [
      team.id,
      `"${team.name.replace(/"/g, '""')}"`,
      `"${team.leader.name.replace(/"/g, '""')}"`,
      team.leader.email,
      team.leader.phone_number || "",
      `"${(team.leader.college || "").replace(/"/g, '""')}"`
    ];

    const nonLeaderMembers = team.memberships.filter(m => m.user_id !== team.leader_id);
    
    for (let i = 0; i < maxMembers - 1; i++) {
      if (i < nonLeaderMembers.length) {
        const member = nonLeaderMembers[i];
        row.push(
          `"${member.user.name.replace(/"/g, '""')}"`,
          member.user.email,
          `"${(member.user.college || "").replace(/"/g, '""')}"`
        );
      } else {
        row.push("", "", ""); // empty cells if somehow missing (though it shouldn't be since length == max)
      }
    }
    
    csvContent += row.join(",") + "\n";
  }

  // Return CSV response
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="event_${eventId}_finalized_teams.csv"`,
    },
  });
}
