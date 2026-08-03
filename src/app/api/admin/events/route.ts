import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
      select: { is_admin: true }
    });

    if (!dbUser?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, team_size_max, min_female_required, registration_deadline, themes, is_active } = body;

    if (!name || typeof team_size_max !== 'number' || typeof min_female_required !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        team_size_max,
        min_female_required,
        registration_deadline: registration_deadline ? new Date(registration_deadline) : null,
        themes: Array.isArray(themes) ? themes : [],
        is_active: is_active ?? true,
      }
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err: any) {
    console.error('Error creating event:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
