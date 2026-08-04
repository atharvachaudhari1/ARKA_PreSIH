import { testApiHandler } from 'next-test-api-route-handler';
import * as leaveTeamHandler from '@/app/api/teams/[id]/leave/route';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    team: { 
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    teamMembership: {
      update: jest.fn(),
      delete: jest.fn()
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Leave Team API', () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe('POST /api/teams/:id/leave', () => {
    test('standard member leaves successfully, team status resets if full', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: 'team1',
        status: 'full',
        memberships: [
          { id: 'mem1', user_id: 'user1', role: 'member' },
          { id: 'mem2', user_id: 'leader1', role: 'leader' }
        ]
      });

      await testApiHandler({
        appHandler: leaveTeamHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(200);

          expect(prisma.teamMembership.delete).toHaveBeenCalledWith({
            where: { id: 'mem1' }
          });
          expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id: 'team1' },
            data: { status: 'open' }
          });
        }
      });
    });

    test('leader leaves, next eligible member is promoted to leader', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });

      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: 'team1',
        status: 'open',
        memberships: [
          { id: 'mem1', user_id: 'leader1', role: 'leader' },
          // nextLeader should be the first in the sorted array provided by prisma
          { id: 'mem2', user_id: 'user2', role: 'member' },
          { id: 'mem3', user_id: 'user3', role: 'member' }
        ]
      });

      await testApiHandler({
        appHandler: leaveTeamHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(200);

          // Auto-promote
          expect(prisma.teamMembership.update).toHaveBeenCalledWith({
            where: { id: 'mem2' },
            data: { role: 'leader' }
          });
          expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id: 'team1' },
            data: { leader_id: 'user2' }
          });

          // Delete leaving leader's membership
          expect(prisma.teamMembership.delete).toHaveBeenCalledWith({
            where: { id: 'mem1' }
          });
        }
      });
    });

    test('leader leaves, no other members, team is deleted', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });

      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: 'team1',
        status: 'open',
        memberships: [
          { id: 'mem1', user_id: 'leader1', role: 'leader' }
        ]
      });

      await testApiHandler({
        appHandler: leaveTeamHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(200);

          // Team deleted
          expect(prisma.team.delete).toHaveBeenCalledWith({
            where: { id: 'team1' }
          });
          
          // Should skip updating memberships or team status
          expect(prisma.teamMembership.update).not.toHaveBeenCalled();
          expect(prisma.teamMembership.delete).not.toHaveBeenCalled();
        }
      });
    });

    test('fetches memberships with correct auto_promote tiebreaker ordering', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });

      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: 'team1',
        status: 'open',
        memberships: [
          { id: 'mem1', user_id: 'leader1', role: 'leader' },
          // mem2 has a "worse" id lexically than mem3, but joined earlier.
          // This proves we pick mem2 because of the array order (which simulates Prisma's orderBy),
          // not because mem2 just happens to have the first string ID.
          { id: 'z_mem2', user_id: 'z_user2', role: 'member', joined_at: new Date('2024-01-01') },
          { id: 'a_mem3', user_id: 'a_user3', role: 'member', joined_at: new Date('2024-01-02') }
        ]
      });

      await testApiHandler({
        appHandler: leaveTeamHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          await fetch({ method: 'POST' });
          
          expect(prisma.team.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
              include: expect.objectContaining({
                memberships: expect.objectContaining({
                  orderBy: [
                    { joined_at: 'asc' },
                    { user: { created_at: 'asc' } },
                    { user: { id: 'asc' } }
                  ]
                })
              })
            })
          );
          
          // Assert that the app actually acts on the returned array's order
          // It should promote 'z_mem2' (the first eligible member in the array) to leader
          expect(prisma.teamMembership.update).toHaveBeenCalledWith({
            where: { id: 'z_mem2' },
            data: { role: 'leader' }
          });
          
          expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id: 'team1' },
            data: { leader_id: 'z_user2' }
          });
        }
      });
    });
  });
});
