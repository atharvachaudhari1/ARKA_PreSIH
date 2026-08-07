/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from 'next-test-api-route-handler';
import * as removeMemberHandler from '@/app/api/teams/[id]/remove-member/route';
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

describe('Remove Member API', () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe('POST /api/teams/:id/remove-member', () => {
    const baseTeam = {
      id: 'team1',
      status: 'full',
      name: 'Team One',
      memberships: [
        { id: 'mem1', user_id: 'user2', role: 'member', user: { id: 'user2', name: 'Bob', email: 'bob@test.com' } },
        { id: 'memLeader', user_id: 'leader1', role: 'leader', user: { id: 'leader1', name: 'Alice', email: 'alice@test.com' } }
      ]
    };

    test('leader removes a member successfully, team status resets if full', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_leader' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);

      await testApiHandler({
        appHandler: removeMemberHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'user2' })
          });
          expect(res.status).toBe(200);

          expect(prisma.teamMembership.delete).toHaveBeenCalledWith({
            where: { id: 'mem1' }
          });
          expect(prisma.teamSlot.updateMany).toHaveBeenCalledWith({
            where: { team_id: 'team1', filled_by_user_id: 'user2' },
            data: { is_filled: false, filled_by_user_id: null }
          });
          expect(prisma.team.update).toHaveBeenCalledWith({
            where: { id: 'team1' },
            data: { status: 'open' }
          });
        }
      });
    });

    test('non-leader member cannot remove anyone, gets 403', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user2' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user2' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);

      await testApiHandler({
        appHandler: removeMemberHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'user2' })
          });
          expect(res.status).toBe(403);

          const json = await res.json();
          expect(json.error).toBe('Only the team leader can remove members.');
        }
      });
    });

    test('leader cannot remove themselves', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_leader' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);

      await testApiHandler({
        appHandler: removeMemberHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'leader1' })
          });
          expect(res.status).toBe(400);

          const json = await res.json();
          expect(json.error).toContain('cannot remove yourself');
        }
      });
    });

    test('removing a non-member returns 404', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_leader' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'leader1' });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);

      await testApiHandler({
        appHandler: removeMemberHandler,
        params: { id: 'team1' } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: 'ghost' })
          });
          expect(res.status).toBe(404);

          const json = await res.json();
          expect(json.error).toBe('That user is not a member of this team.');
        }
      });
    });
  });
});
