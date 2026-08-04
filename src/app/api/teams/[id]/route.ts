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

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ team });
}
