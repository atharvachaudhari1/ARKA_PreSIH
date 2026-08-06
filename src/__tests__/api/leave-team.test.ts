/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from 'next-test-api-route-handler';
import * as leaveTeamHandler from '@/app/api/teams/[id]/leave/route';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

jest.mock("@/lib/prisma", () => {
  const mockP = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn(), delete: jest.fn() },
    teamMembership: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    teamSlot: { create: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    event: { findFirst: jest.fn(), create: jest.fn() },
    joinRequest: { findFirst: jest.fn(), create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    joinRequestOpinion: { upsert: jest.fn() },
    notification: { create: jest.fn() },
    chatMessage: { findMany: jest.fn(), create: jest.fn() },
    report: { findMany: jest.fn() },
  };
  mockP.$transaction = jest.fn((callback) => callback(mockP));
  return { prisma: mockP };
});

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

    test('leader attempts to leave, gets 400', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });

      (prisma.team.findUnique as jest.Mock).mockResolvedValue({
        id: 'team1',
        status: 'open',
        memberships: [
          { id: 'mem1', user_id: 'leader1', role: 'leader' },
          { id: 'mem2', user_id: 'user2', role: 'member' }
        ]
      });

      await testApiHandler({
        appHandler: leaveTeamHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'POST' });
          expect(res.status).toBe(400);
          
          const json = await res.json();
          expect(json.error).toBe('As leader, you must dissolve the team to leave.');
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
        }
      });
    });
  });
});
