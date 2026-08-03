import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { auth_user_id: authData.user.id },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found in DB' }, { status: 404 });
    }

    const body = await request.json();
    const { reported_user_id, reported_team_id, reason, description } = body;

    // Validate exactly one target
    if ((reported_user_id && reported_team_id) || (!reported_user_id && !reported_team_id)) {
      return NextResponse.json(
        { error: 'Must provide exactly one of reported_user_id or reported_team_id' },
        { status: 400 }
      );
    }

    // Validate self-report prevention
    if (reported_user_id === currentUser.id) {
      return NextResponse.json(
        { error: 'Self-reporting is not allowed' },
        { status: 400 }
      );
    }

    if (reported_team_id) {
      // Prevent reporting a team if the user is a member of it (optional but good practice, wait, the user didn't explicitly ask for this, only self-report prevention which applies to user ID). Let's stick to self-reporting user id for now.
    }

    const report = await prisma.report.create({
      data: {
        reporter_id: currentUser.id,
        reported_user_id: reported_user_id || null,
        reported_team_id: reported_team_id || null,
        reason,
        description: description || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });

  } catch (error: any) {
    // Handle Prisma unique constraint violation (duplicate report)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'You have already reported this target' },
          { status: 409 }
        );
      }
    }

    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
