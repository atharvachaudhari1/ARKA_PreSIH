import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Proficiency } from "@prisma/client";

const VALID_PROFICIENCIES = ["beginner", "intermediate", "advanced", "expert"];

// ── POST /api/users/skills — add or update a skill ──────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { auth_user_id: user.id }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let body: { skill: string; proficiency: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.skill || typeof body.skill !== "string" || body.skill.trim().length === 0)
    return NextResponse.json({ error: "skill is required" }, { status: 400 });

  if (body.proficiency && !VALID_PROFICIENCIES.includes(body.proficiency))
    return NextResponse.json({ error: `proficiency must be one of: ${VALID_PROFICIENCIES.join(", ")}` }, { status: 400 });

  const skill = await prisma.userSkill.upsert({
    where: { user_id_skill: { user_id: dbUser.id, skill: body.skill.trim() } },
    create: { user_id: dbUser.id, skill: body.skill.trim(), proficiency: (body.proficiency as Proficiency) ?? "intermediate" },
    update: { proficiency: (body.proficiency as Proficiency) ?? "intermediate" },
    select: { skill: true, proficiency: true },
  });

  return NextResponse.json({ skill }, { status: 201 });
}

// ── DELETE /api/users/skills — remove a skill ───────────────────────────
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { auth_user_id: user.id }, select: { id: true } });
  if (!dbUser) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let body: { skill: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.skill) return NextResponse.json({ error: "skill is required" }, { status: 400 });

  await prisma.userSkill.deleteMany({
    where: { user_id: dbUser.id, skill: body.skill.trim() },
  });

  return NextResponse.json({ message: "Skill removed" });
}
