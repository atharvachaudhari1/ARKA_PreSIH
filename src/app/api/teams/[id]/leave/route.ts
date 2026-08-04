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

    const membership = team.memberships.find(m => m.user_id === currentUser.id);
    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // If user is the leader, handle succession
      if (membership.role === 'leader') {
        const otherMembers = team.memberships.filter(m => m.user_id !== currentUser.id);
        
        if (otherMembers.length > 0) {
          if (team.succession_mode === 'manual') {
            throw new Error("MANUAL_SUCCESSION_REQUIRED");
          }
          
          // Auto promote the next eligible member
          // The array is already ordered by joined_at, user.created_at, user.id
          const nextLeader = otherMembers[0];
          
          await tx.teamMembership.update({
            where: { id: nextLeader.id },
            data: { role: 'leader' }
          });
          
          await tx.team.update({
            where: { id: team.id },
            data: { leader_id: nextLeader.user_id }
          });
        } else {
          // No other members, delete the team
          // Team deletion will cascade to TeamMembership, JoinRequest, ChatMessage, etc.
          // Notification team_id will be set to NULL (onDelete: SetNull).
          await tx.team.delete({
            where: { id: team.id }
          });
          return; // Skip the rest, team is gone
        }
      }

      // Delete the leaving user's membership
      await tx.teamMembership.delete({
        where: { id: membership.id }
      });

      // Free up any TeamSlot this user was occupying
      await tx.teamSlot.updateMany({
        where: { team_id: team.id, filled_by_user_id: currentUser.id },
        data: { is_filled: false, filled_by_user_id: null }
      });

      // Check if team status needs to change from 'full' to 'open'
      // Use team.id, not team_id from params, since it's confirmed
      if (team.status === 'full') {
        await tx.team.update({
          where: { id: team.id },
          data: { status: 'open' }
        });
      }
    });

    return NextResponse.json({ message: 'Successfully left the team' });

  } catch (error: any) {
    console.error('Error leaving team:', error);
    if (error.message === 'MANUAL_SUCCESSION_REQUIRED') {
      return NextResponse.json({ error: 'You must transfer leadership manually before leaving, or change succession mode to auto-promote.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
