import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await prisma.event.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (err: any) {
    console.error('Error fetching events:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const adminUser = await prisma.user.findUnique({ where: { auth_user_id: user.id } });
    if (!adminUser?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    if (!body.name || !body.team_size_max || !body.min_female_required) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name: body.name,
        team_size_max: parseInt(body.team_size_max),
        min_female_required: parseInt(body.min_female_required),
        registration_deadline: body.registration_deadline ? new Date(body.registration_deadline) : null,
        themes: body.themes || [],
        is_active: body.is_active ?? true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err: any) {
    console.error('Error creating event:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
