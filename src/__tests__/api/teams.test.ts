/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as teamsHandler from "@/app/api/teams/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    team: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    teamMembership: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Teams API", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe("GET /api/teams", () => {
    test("returns teams and applies filters", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      
      const mockTeams = [
        {
          id: "team1",
          name: "Team A",
          status: "open",
          needed_female_count: 1,
          domain_interest: "Web3",
          leader: { name: "Leader" },
          memberships: [],
        },
      ];
      
      (prisma.team.findMany as jest.Mock).mockResolvedValue(mockTeams);

      await testApiHandler({
        appHandler: teamsHandler,
        url: "/api/teams?status=open&domain=Web3&gender_need=true&min_experience=2&skills_needed[]=React",
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          
          const data = await res.json();
          expect(data.teams).toEqual(mockTeams);
          
          // Verify prisma was called with the correct filter
          expect(prisma.team.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: {
                status: "open",
                domain_interest: "Web3",
                needed_female_count: { gt: 0 },
                min_experience_required: { lte: 2 },
                skills_needed: { hasSome: ["React"] },
              },
            })
          );
        },
      });
    });
  });

  describe("POST /api/teams", () => {
    test("creates a team and assigns leader", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1", counts_toward_female_quota: true });
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: "event1", min_female_required: 1 });
      
      (prisma.team.create as jest.Mock).mockResolvedValue({ id: "team1", name: "New Team" });

      await testApiHandler({
        appHandler: teamsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({
              name: "New Team",
              domain_interest: "Web3",
              skills_needed: ["React"],
            }),
          });
          
          expect(res.status).toBe(201);
          
          // Check if team was created correctly
          expect(prisma.team.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                name: "New Team",
                leader_id: "db_user1",
                needed_female_count: 0, // Event min is 1, user counts towards it, so 0 needed
              }),
            })
          );
          
          // Check if membership was created
          expect(prisma.teamMembership.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: {
                team_id: "team1",
                user_id: "db_user1",
                role: "leader",
              },
            })
          );
          
          // Check if user's contact visibility was forced to public
          expect(prisma.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: "db_user1" },
              data: { preferred_contact_visibility: "public_to_logged_in" },
            })
          );
        },
      });
    });

    test("returns JSON error response on validation failure (missing name)", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1", counts_toward_female_quota: true });
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: "event1", min_female_required: 1 });

      await testApiHandler({
        appHandler: teamsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({
              domain_interest: "Web3",
              skills_needed: ["React"],
            }),
          });
          
          expect(res.status).toBe(400);
          
          const data = await res.json();
          expect(data.error).toBe("Team name is required");
        },
      });
    });

    test("returns JSON error response on unhandled exception", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1", counts_toward_female_quota: true });
      (prisma.event.findFirst as jest.Mock).mockResolvedValue({ id: "event1", min_female_required: 1 });
      
      // Force an exception during creation
      (prisma.team.create as jest.Mock).mockRejectedValue(new Error("Database connection failed"));

      await testApiHandler({
        appHandler: teamsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({
              name: "New Team",
              domain_interest: "Web3",
            }),
          });
          
          expect(res.status).toBe(500);
          
          const data = await res.json();
          expect(data.error).toBe("Database connection failed");
        },
      });
    });
  });
});
