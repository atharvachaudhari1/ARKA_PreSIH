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
  const skill = searchParams.get("skill")?.trim() || "";
  const department = searchParams.get("department")?.trim() || "";
  const gender = searchParams.get("gender")?.trim() || "";
  const minHackathons = parseInt(searchParams.get("min_hackathons") || "0", 10) || 0;
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(60, Math.max(1, parseInt(searchParams.get("page_size") || "9", 10) || 9));

  const where: Record<string, unknown> = {
    id: { not: user.id },
    // Solo = not a member of any active (non-dissolved) team
    team_memberships: {
      none: { team: { status: { not: "dissolved" } } }
    },
    // Only registered participants who have been active recently. A user who
    // logs out stops generating authenticated requests, so after the window
    // passes they drop out of the directory.
    last_seen_at: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
  };

  const and: Record<string, unknown>[] = [];
  if (skill) and.push({ skills: { some: { skill: { contains: skill, mode: "insensitive" } } } });
  if (department) and.push({ department: { contains: department, mode: "insensitive" } });
  if (gender) and.push({ gender: { equals: gender, mode: "insensitive" } });
  if (minHackathons > 0) and.push({ past_hackathons_count: { gte: minHackathons } });
  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { college: { contains: search, mode: "insensitive" } },
      ]
    });
  }
  if (and.length > 0) where.AND = and;

  const [hackers, total, facetUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        department: true,
        college: true,
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
    prisma.user.findMany({
      where: {
        id: { not: user.id },
        team_memberships: { none: { team: { status: { not: "dissolved" } } } },
        last_seen_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: {
        gender: true,
        skills: { select: { skill: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Departments come from the persistent directory (populated whenever a user
  // sets/edits their department), so codes remain available in the filter even
  // after the people who listed them leave or are removed.
  const departmentRows = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  const departments = departmentRows.map((d) => d.name);

  // Normalize gender to title-case (e.g. "male" -> "Male") so facets dedupe.
  const genders = Array.from(
    new Set(
      facetUsers
        .map((u) => u.gender)
        .filter((g): g is string => !!g && g.trim() !== "")
        .map((g) => g.trim().replace(/\b\w/g, (c) => c.toUpperCase()))
    )
  ).sort((a, b) => a.localeCompare(b));

  const skills = Array.from(
    new Set(
      facetUsers
        .flatMap((u) => u.skills.map((s) => s.skill))
        .map((s) => s.trim())
        .filter((s) => s !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({
    hackers: hackers.map((h) => ({
      ...h,
      department: h.department?.trim() ? h.department.trim().toUpperCase() : h.department,
      gender: h.gender?.trim() ? h.gender.trim().replace(/\b\w/g, (c) => c.toUpperCase()) : h.gender,
    })),
    total,
    page,
    pageSize,
    totalPages,
    facets: { departments, genders, skills },
  });
}
