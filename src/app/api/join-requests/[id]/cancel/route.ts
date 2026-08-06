import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const joinRequest = await prisma.joinRequest.findUnique({
    where: { id: id },
  });

  if (!joinRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (joinRequest.status !== "pending") return NextResponse.json({ error: "Only pending requests can be cancelled." }, { status: 400 });

  let isAuthorized = false;

  if (joinRequest.direction === "user_to_team") {
    // Only the requester can cancel their own application
    if (currentUser.id === joinRequest.requester_id) {
      isAuthorized = true;
    }
  } else if (joinRequest.direction === "team_to_user") {
    // Only the team leader can cancel an outbound invite
    const leaderMembership = currentUser.team_memberships.find(m => m.team_id === joinRequest.team_id && m.role === "leader");
    if (leaderMembership) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) return NextResponse.json({ error: "You are not authorized to cancel this request." }, { status: 403 });

  // Soft-delete the pending request by changing status to cancelled
  await prisma.joinRequest.update({
    where: { id: joinRequest.id },
    data: { 
      status: "cancelled",
      resolved_at: new Date()
    }
  });

  return NextResponse.json({ success: true });
}
