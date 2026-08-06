import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const q = url.searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ]
          },
          {
            // Only users not in any active team
            team_memberships: {
              none: {
                team: {
                  status: { not: 'dissolved' }
                }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        college: true,
      },
      take: 5
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[GET /api/users/search] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
