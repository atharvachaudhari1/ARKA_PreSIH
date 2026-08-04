import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const skill = searchParams.get("skill");

  const hackers = await prisma.user.findMany({
    where: {
      team_memberships: { none: {} },
      ...(skill ? { skills: { some: { skill: { contains: skill, mode: "insensitive" } } } } : {})
    },
    select: {
      id: true,
      name: true,
      department: true,
      gender: true,
      past_hackathons_count: true,
      bio: true,
      presentation_skill_rating: true,
      skills: {
        select: {
          skill: true,
          proficiency: true
        }
      }
    },
    orderBy: {
      created_at: "desc"
    },
    take: 50
  });

  return NextResponse.json({ hackers });
}
