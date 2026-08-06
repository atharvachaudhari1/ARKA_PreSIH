import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team_id = (await params).id;

    const team = await prisma.team.findUnique({
      where: { id: team_id },
      include: {
        memberships: {
          include: { user: true }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.leader_id !== currentUser.id) {
      return NextResponse.json({ error: 'Only the team leader can dissolve the team.' }, { status: 403 });
    }

    if (team.status === 'dissolved') {
      return NextResponse.json({ error: 'Team is already dissolved.' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete the team
      await tx.team.update({
        where: { id: team.id },
        data: { status: 'dissolved' }
      });

      // 2. Notify other members before deleting their memberships
      const otherMembers = team.memberships.filter(m => m.user_id !== currentUser.id);
      
      if (otherMembers.length > 0) {
        await tx.notification.createMany({
          data: otherMembers.map(m => ({
            user_id: m.user_id,
            team_id: team.id,
            type: 'team_dissolved' as any,
            payload: { team_name: team.name, message: "Your team was dissolved by the leader. You are now free to join or create another team." }
          }))
        });
      }

      // 3. (Removed) We do NOT delete memberships so they appear in Past Teams history.

      // 4. Free up slots
      await tx.teamSlot.updateMany({
        where: { team_id: team.id },
        data: { is_filled: false, filled_by_user_id: null }
      });

      // 5. Cancel all pending join requests
      await tx.joinRequest.updateMany({
        where: { team_id: team.id, status: 'pending' },
        data: { status: 'cancelled' }
      });
    });

    return NextResponse.json({ message: 'Team successfully dissolved' });

  } catch (error: any) {
    console.error('Error dissolving team:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
