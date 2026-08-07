import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recomputeNeededFemaleCount } from '@/lib/teamQuota';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { scheduleAfter } from '@/lib/scheduleAfter';

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
        event: true,
        memberships: {
          include: { user: true },
          orderBy: [
            { joined_at: 'asc' },
            { user: { created_at: 'asc' } },
            { user: { id: 'asc' } }
          ]
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only the team leader can remove members
    const leaderMembership = team.memberships.find(
      m => m.user_id === currentUser.id && m.role === 'leader'
    );
    if (!leaderMembership) {
      return NextResponse.json({ error: 'Only the team leader can remove members.' }, { status: 403 });
    }

    let body: { user_id?: string };
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { user_id } = body || {};
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (user_id === currentUser.id) {
      return NextResponse.json({ error: 'As leader, you cannot remove yourself. Transfer leadership or dissolve the team instead.' }, { status: 400 });
    }

    const targetMembership = team.memberships.find(m => m.user_id === user_id);
    if (!targetMembership) {
      return NextResponse.json({ error: 'That user is not a member of this team.' }, { status: 404 });
    }

    const removedUser = targetMembership.user;

    await prisma.$transaction(async (tx) => {
      // Delete the member's membership
      await tx.teamMembership.delete({
        where: { id: targetMembership.id }
      });

      // Free up any TeamSlot this member was occupying
      await tx.teamSlot.updateMany({
        where: { team_id: team.id, filled_by_user_id: user_id },
        data: { is_filled: false, filled_by_user_id: null }
      });

      // Recompute female quota requirement now that membership changed
      await recomputeNeededFemaleCount(tx, team.id);

      // Check if team status needs to change from 'full' to 'open'
      if (team.status === 'full') {
        await tx.team.update({
          where: { id: team.id },
          data: { status: 'open' }
        });
      }
    });

    // Email the removed user without blocking the response
    if (removedUser.email) {
      scheduleAfter(async () => {
        await sendEmail({
          to: removedUser.email,
          subject: `You were removed from ${team.name}`,
          html: `<p>Hello ${removedUser.name}!</p><p>The leader of <strong>${team.name}</strong> has removed you from the team.</p><p>You are now free to browse other open teams on TeamUp.</p>`
        });
      });
    }

    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
