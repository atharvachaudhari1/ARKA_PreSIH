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

  // Get search params for pagination
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  // Verify event exists
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  // Unmatched users: NO team membership for this event, NO pending join request for this event
  const whereClause = {
    NOT: {
      OR: [
        { team_memberships: { some: { team: { event_id: eventId } } } },
        { sent_requests: { some: { team: { event_id: eventId }, status: "pending" } } }
      ]
    }
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      college: true,
      gender: true,
      past_hackathons_count: true,
      presentation_skill_rating: true,
      verification_status: true,
      skills: {
        select: { skill: true, proficiency: true }
      }
    },
    skip,
    take: limit,
    orderBy: { created_at: "desc" }
  });

  const totalCount = await prisma.user.count({ where: whereClause });

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total_count: totalCount,
      total_pages: Math.ceil(totalCount / limit)
    }
  });
}
