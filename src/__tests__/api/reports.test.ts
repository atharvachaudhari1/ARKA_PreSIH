/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from 'next-test-api-route-handler';
import * as reportsHandler from '@/app/api/reports/route';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { Prisma } from '@prisma/client';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    report: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Reports API', () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe('POST /api/reports', () => {
    test('creates a report successfully', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      (prisma.report.create as jest.Mock).mockResolvedValue({ id: 'report1' });

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reported_user_id: 'user2',
              reason: 'spam',
            }),
          });
          expect(res.status).toBe(201);
          expect(prisma.report.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                reporter_id: 'user1',
                reported_user_id: 'user2',
                reported_team_id: null,
                reason: 'spam',
              }),
            })
          );
        },
      });
    });

    test('prevents self-reporting', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reported_user_id: 'user1', // Same as reporter
              reason: 'harassment',
            }),
          });
          expect(res.status).toBe(400);
          expect(prisma.report.create).not.toHaveBeenCalled();
        },
      });
    });

    test('prevents duplicate reports by returning 409 on Prisma unique constraint error', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      // Mock Prisma P2002 error
      (prisma.report.create as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '1',
        })
      );

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reported_team_id: 'team1',
              reason: 'inappropriate_content',
            }),
          });
          expect(res.status).toBe(409);
        },
      });
    });

    test('delegates duplicate prevention entirely to DB partial index (no app-level block for resolved reports)', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      // Reset any mock tracking for findFirst
      (prisma.report.findFirst as jest.Mock).mockClear();

      // Mock Prisma succeeding (simulating that the DB partial index allows the insert because previous reports are resolved)
      (prisma.report.create as jest.Mock).mockResolvedValue({ id: 'report2' });

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reported_team_id: 'team1',
              reason: 'inappropriate_content',
            }),
          });
          expect(res.status).toBe(201);
          
          // The API should NOT attempt any app-level duplicate checks (findFirst, findUnique, findMany)
          // It must delegate entirely to the database's partial unique constraint (P2002 error).
          expect(prisma.report.findFirst).not.toHaveBeenCalled();
          
          // Confirm it proceeded directly to create
          expect(prisma.report.create).toHaveBeenCalled();
        },
      });
    });

    test('fails if both reported_user_id and reported_team_id are provided', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reported_user_id: 'user2',
              reported_team_id: 'team1',
              reason: 'spam',
            }),
          });
          expect(res.status).toBe(400);
          expect(prisma.report.create).not.toHaveBeenCalled();
        },
      });
    });

    test('fails if neither reported_user_id nor reported_team_id is provided', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'auth_user_1' } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });

      await testApiHandler({
        appHandler: reportsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            body: JSON.stringify({
              reason: 'spam',
            }),
          });
          expect(res.status).toBe(400);
          expect(prisma.report.create).not.toHaveBeenCalled();
        },
      });
    });
  });
});
