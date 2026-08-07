/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as joinRequestsHandler from "@/app/api/join-requests/route";
import * as decisionHandler from "@/app/api/join-requests/[id]/decision/route";
import * as opinionHandler from "@/app/api/join-requests/[id]/opinion/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

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

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Join Requests API", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe("POST /api/join-requests", () => {
    test("creates a user_to_team request successfully", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "db_user_1",
        team_memberships: [],
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue({ id: "team1", status: "open", event: { team_size_max: 6 }, _count: { memberships: 1 } });
      (prisma.joinRequest.findFirst as jest.Mock).mockResolvedValue(null); // No existing pending request
      (prisma.joinRequest.create as jest.Mock).mockResolvedValue({ id: "req1", status: "pending" });

      await testApiHandler({
        appHandler: joinRequestsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ team_id: "team1", direction: "user_to_team", applicantBio: "I am a great hacker!" }),
          });

          expect(res.status).toBe(201);
          expect(prisma.joinRequest.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: {
                team_id: "team1",
                requester_id: "db_user_1",
                direction: "user_to_team",
                status: "pending",
              },
            })
          );
        },
      });
    });

    test("prevents duplicate pending requests", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "db_user_1",
        team_memberships: [],
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue({ id: "team1", status: "open", event: { team_size_max: 6 }, _count: { memberships: 1 } });
      (prisma.joinRequest.findFirst as jest.Mock).mockResolvedValue({ id: "existing_req", status: "pending" });

      await testApiHandler({
        appHandler: joinRequestsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ team_id: "team1", direction: "user_to_team", applicantBio: "I am a great hacker!" }),
          });
          expect(res.status).toBe(409); // Conflict
          expect(prisma.joinRequest.create).not.toHaveBeenCalled();
        },
      });
    });
  });

  describe("PATCH /api/join-requests/:id/opinion", () => {
    test("allows team members to submit an opinion", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "db_user_1",
        team_memberships: [{ team_id: "team1" }],
      });
      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req1",
        team_id: "team1",
        status: "pending",
        requester: { name: "Applicant One" },
        team: { name: "Team A", leader_id: "leader1" },
      });

      await testApiHandler({
        appHandler: opinionHandler,
        params: { id: "req1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PATCH",
            body: JSON.stringify({ opinion: "approve" }),
          });
          const body = await res.clone().json().catch(()=>({})); console.log("Failed with body:", body); expect(res.status).toBe(200);
          expect(prisma.joinRequestOpinion.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
              update: { opinion: "approve" },
            })
          );
        },
      });
    });
  });

  describe("PATCH /api/join-requests/:id/decision", () => {
    test("leader can accept a request and trigger cascade expirations", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
  if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
  return { id: args?.where?.id, counts_toward_female_quota: true, team_memberships: [] };
});
      
      const mockTeam = {
        id: "team1",
        name: "Team A",
        status: "open",
        event: { team_size_max: 6, min_female_required: 0 },
        memberships: [{ id: "mem1", user: {} }] // 1 existing member + 1 incoming = 2 (not full)
      };

      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req1",
        team_id: "team1",
        status: "pending",
        direction: "user_to_team",
        requester_id: "applicant1",
        team: mockTeam,
        requester: { team_memberships: [] },
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      (prisma.joinRequest.findMany as jest.Mock).mockResolvedValue([]); // No other requests

      await testApiHandler({
        appHandler: decisionHandler,
        params: { id: "req1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PATCH",
            body: JSON.stringify({ decision: "accept" }),
          });
          
          const body = await res.clone().json().catch(()=>({})); console.log("Failed with body:", body); expect(res.status).toBe(200);
          
          // Should update request status to accepted
          expect(prisma.joinRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: "req1" },
              data: expect.objectContaining({ status: "accepted" })
            })
          );
          
          // Should create TeamMembership
          expect(prisma.teamMembership.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: { team_id: "team1", user_id: "applicant1", role: "member" }
            })
          );

          // Should expire other requests for this user
          expect(prisma.joinRequest.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { requester_id: "applicant1", status: "pending", id: { not: "req1" } },
              data: expect.objectContaining({ status: "expired", expired_reason: "requester_joined_another_team" })
            })
          );
        },
      });
    });

    test("invited user can accept a team_to_user invite and trigger cascade expirations", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_2" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "applicant1",
        name: "Applicant 1",
        team_memberships: [], // Not in a team yet
      });
      
      const mockTeam = {
        id: "team1",
        name: "Team A",
        status: "open",
        leader_id: "leader1",
        event: { team_size_max: 6, min_female_required: 0 },
        memberships: [{ id: "mem1", user: {} }]
      };

      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req_invite1",
        team_id: "team1",
        status: "pending",
        direction: "team_to_user",
        requester_id: "applicant1",
        team: mockTeam,
        requester: { team_memberships: [] },
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      (prisma.joinRequest.findMany as jest.Mock).mockResolvedValue([]); // No other requests

      await testApiHandler({
        appHandler: decisionHandler,
        params: { id: "req_invite1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "PATCH",
            body: JSON.stringify({ decision: "accept" }),
          });
          
          const body = await res.clone().json().catch(()=>({})); console.log("Failed with body:", body); expect(res.status).toBe(200);
          
          // Should update request status to accepted
          expect(prisma.joinRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: "req_invite1" },
              data: expect.objectContaining({ status: "accepted" })
            })
          );
          
          // Should create TeamMembership
          expect(prisma.teamMembership.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: { team_id: "team1", user_id: "applicant1", role: "member" }
            })
          );
        },
      });
    });
    test("rejects accept if it would leave remainingSlots < stillNeeded (general quota unreachable case)", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
  if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
  return { id: args?.where?.id, counts_toward_female_quota: true, team_memberships: [] };
});
      
      const mockTeam = {
        id: "team1",
        status: "open",
        event: { team_size_max: 5, min_female_required: 3 }, // Needs 3 females
        memberships: [
          // 2 existing male members
          { id: "mem1", user: { counts_toward_female_quota: false } },
          { id: "mem2", user: { counts_toward_female_quota: false } }
        ]
      };

      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req1",
        team_id: "team1",
        status: "pending",
        direction: "user_to_team",
        requester_id: "applicant1",
        team: mockTeam,
        // Applicant is also male.
        // Current: 2. New: 3. Max: 5. Remaining slots: 2.
        // Females: 0. Still needed: 3.
        // 3 > 2 -> mathematically impossible, should reject!
        requester: { counts_toward_female_quota: false, team_memberships: [] },
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      await testApiHandler({
        appHandler: decisionHandler,
        params: { id: "req1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "PATCH", body: JSON.stringify({ decision: "accept" }) });
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toContain("would have 2 slots left, but still needs 3 female member(s)");
          expect(prisma.joinRequest.update).not.toHaveBeenCalled();
        },
      });
    });

    test("rejects accept if it fills the last slot without meeting quota (original scenario)", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
  if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
  return { id: args?.where?.id, counts_toward_female_quota: true, team_memberships: [] };
});
      
      const mockTeam = {
        id: "team1",
        status: "open",
        event: { team_size_max: 6, min_female_required: 1 }, // Needs 1 female
        memberships: [
          // 5 existing male members
          { id: "m1", user: { counts_toward_female_quota: false } },
          { id: "m2", user: { counts_toward_female_quota: false } },
          { id: "m3", user: { counts_toward_female_quota: false } },
          { id: "m4", user: { counts_toward_female_quota: false } },
          { id: "m5", user: { counts_toward_female_quota: false } }
        ]
      };

      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req1",
        team_id: "team1",
        status: "pending",
        direction: "user_to_team",
        requester_id: "applicant1",
        team: mockTeam,
        // Applicant is also male. New count: 6. Remaining: 0. Still needed: 1.
        requester: { counts_toward_female_quota: false, team_memberships: [] },
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      await testApiHandler({
        appHandler: decisionHandler,
        params: { id: "req1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "PATCH", body: JSON.stringify({ decision: "accept" }) });
          expect(res.status).toBe(400);
          const body = await res.json();
          expect(body.error).toContain("would have 0 slots left, but still needs 1 female member(s)");
          expect(prisma.joinRequest.update).not.toHaveBeenCalled();
        },
      });
    });

    test("accepts request if remainingSlots >= stillNeeded even if quota isn't met YET", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockImplementation(async (args) => {
  if (args?.where?.id === "leader1" || args?.where?.auth_user_id === "auth_user_1") return { id: "leader1", team_memberships: [{ team_id: "team1", role: "leader" }] };
  return { id: args?.where?.id, counts_toward_female_quota: true, team_memberships: [] };
});
      
      const mockTeam = {
        id: "team1",
        status: "open",
        event: { team_size_max: 6, min_female_required: 1 }, // Needs 1 female
        memberships: [
          // 4 existing male members
          { id: "m1", user: { counts_toward_female_quota: false } },
          { id: "m2", user: { counts_toward_female_quota: false } },
          { id: "m3", user: { counts_toward_female_quota: false } },
          { id: "m4", user: { counts_toward_female_quota: false } }
        ]
      };

      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req1",
        team_id: "team1",
        status: "pending",
        direction: "user_to_team",
        requester_id: "applicant1",
        team: mockTeam,
        // Applicant is also male. New count: 5. Remaining: 1. Still needed: 1.
        // 1 remaining >= 1 needed, so this is valid.
        requester: { counts_toward_female_quota: false, team_memberships: [] },
      });
      (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);

      (prisma.joinRequest.findMany as jest.Mock).mockResolvedValue([]);

      await testApiHandler({
        appHandler: decisionHandler,
        params: { id: "req1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "PATCH", body: JSON.stringify({ decision: "accept" }) });
          const body = await res.clone().json().catch(()=>({})); console.log("Failed with body:", body); expect(res.status).toBe(200); // Success!
          expect(prisma.joinRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ status: "accepted" }) })
          );
        },
      });
    });
  });
});



