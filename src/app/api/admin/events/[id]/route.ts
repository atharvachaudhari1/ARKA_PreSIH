import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    // Await params for Next.js 15+ compatibility
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const body = await req.json();
    
    // Only extract updatable fields
    const { name, team_size_max, min_female_required, registration_deadline, themes, is_active } = body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (team_size_max !== undefined) updateData.team_size_max = team_size_max;
    if (min_female_required !== undefined) updateData.min_female_required = min_female_required;
    if (registration_deadline !== undefined) updateData.registration_deadline = registration_deadline ? new Date(registration_deadline) : null;
    if (themes !== undefined && Array.isArray(themes)) updateData.themes = themes;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    if (team_size_max !== undefined || min_female_required !== undefined) {
      const teams = await prisma.team.findMany({
        where: { event_id: eventId },
        include: {
          memberships: {
            include: { user: true }
          },
          _count: {
            select: { memberships: true }
          }
        }
      });
      
      for (const t of teams) {
        if (team_size_max !== undefined && t._count.memberships > team_size_max) {
          return NextResponse.json(
            { error: `team_size_max cannot be set below the largest current team for this event (${t._count.memberships} members).` },
            { status: 400 }
          );
        }
        if (min_female_required !== undefined) {
          const verifiedFemales = t.memberships.filter(m => m.user.counts_toward_female_quota && m.user.verification_status === 'verified').length;
          if (verifiedFemales < min_female_required) {
            return NextResponse.json(
              { error: `min_female_required cannot be set above what existing teams satisfy (a team has only ${verifiedFemales} verified female members).` },
              { status: 400 }
            );
          }
        }
      }
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    return NextResponse.json(event);
  } catch (err: any) {
    console.error('Error updating event:', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
