import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Only team members can fetch chat
  const teamId = String(params.id);
  const isMember = currentUser.team_memberships.some(m => m.team_id === teamId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.chatMessage.findMany({
    where: { team_id: teamId },
    include: {
      sender: { select: { id: true, name: true } }
    },
    orderBy: { created_at: "desc" },
    take: 100
  });

  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = await prisma.user.findUnique({
    where: { auth_user_id: authUser.id },
    include: { team_memberships: true }
  });
  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const teamId = String(params.id);
  const isMember = currentUser.team_memberships.some(m => m.team_id === teamId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.content || typeof body.content !== "string" || body.content.trim() === "") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      team_id: teamId,
      sender_id: currentUser.id,
      content: body.content.trim()
    },
    include: {
      sender: { select: { id: true, name: true } }
    }
  });

  return NextResponse.json({ message }, { status: 201 });
}
