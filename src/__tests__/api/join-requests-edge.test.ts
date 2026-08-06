/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as decisionHandler from "@/app/api/join-requests/[id]/decision/route";
import * as cancelHandler from "@/app/api/join-requests/[id]/cancel/route";
import * as requestsHandler from "@/app/api/join-requests/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn() },
    joinRequest: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    teamSlot: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    teamMembership: { create: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Join Requests - Mixed Directions and Cancel Edges", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({ auth: { getUser: mockAuthGetUser } });
  });

  test("accepting an invite expires other requests (mixed directions) and notifies their leaders", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
    
    // User accepting the invite
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "applicant1", name: "Applicant 1", team_memberships: []
    });
    
    const mockTeamB = {
      id: "teamB", name: "Team B", status: "open", leader_id: "leaderB",
      event: { team_size_max: 6, min_female_required: 0 },
      memberships: [{ id: "mem1", user: {} }]
    };

    // The invite being accepted
    (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
      id: "req_invite_B", team_id: "teamB", status: "pending", direction: "team_to_user",
      requester_id: "applicant1", team: mockTeamB, requester: { name: "Applicant 1", team_memberships: [] }
    });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeamB);

    // The other request (user_to_team to Team A)
    const mockTeamA = { leader_id: "leaderA" };
    (prisma.joinRequest.findMany as jest.Mock).mockResolvedValue([
      { id: "req_app_A", team_id: "teamA", status: "pending", direction: "user_to_team", requester_id: "applicant1", team: mockTeamA }
    ]);

    await testApiHandler({
      appHandler: decisionHandler,
      params: { id: "req_invite_B" } as any,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ decision: "accept" }) });
        if (res.status !== 200) {
           const b = await res.json();
           console.log("TEST FAILED WITH 400:", b);
        }
        expect(res.status).toBe(200);
        
        // Assert other request is expired
        expect(prisma.joinRequest.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { requester_id: "applicant1", status: "pending", id: { not: "req_invite_B" } },
            data: expect.objectContaining({ status: "expired" })
          })
        );
        
        // Assert Team A's leader was notified
        expect(prisma.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              user_id: "leaderA", // specifically the leader of Team A, not the applicant
              type: "request_expired_other_team_joined"
            })
          })
        );
      },
    });
  });

  test("rejecting an invite notifies the team leader", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "applicant1", name: "Applicant 1", team_memberships: []
    });
    
    const mockTeam = { id: "teamB", name: "Team B", leader_id: "leaderB" };
    (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
      id: "req_invite_B", team_id: "teamB", status: "pending", direction: "team_to_user",
      requester_id: "applicant1", team: mockTeam, requester: { name: "Applicant 1", team_memberships: [] }
    });

    await testApiHandler({
      appHandler: decisionHandler,
      params: { id: "req_invite_B" } as any,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ decision: "reject" }) });
        expect(res.status).toBe(200);
        
        expect(prisma.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              user_id: "leaderB",
              type: "request_rejected"
            })
          })
        );
      },
    });
  });

  describe("DELETE /api/join-requests/[id]/cancel", () => {
    test("leader of Team X cannot cancel Team Y's outbound invite", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_leaderX" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "leaderX",
        team_memberships: [{ team_id: "teamX", role: "leader" }] // Leader of X
      });
      
      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req_invite_Y", team_id: "teamY", status: "pending", direction: "team_to_user", requester_id: "user1"
      });

      await testApiHandler({
        appHandler: cancelHandler,
        params: { id: "req_invite_Y" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(403);
          const json = await res.json();
          expect(json.error).toContain("not authorized");
        },
      });
    });

    test("user cannot cancel someone else's application", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user2" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user2", team_memberships: []
      });
      
      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req_app_user1", team_id: "teamA", status: "pending", direction: "user_to_team", requester_id: "user1"
      });

      await testApiHandler({
        appHandler: cancelHandler,
        params: { id: "req_app_user1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(403);
        },
      });
    });
    
    test("soft deletes request when authorized", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user1", team_memberships: []
      });
      
      (prisma.joinRequest.findUnique as jest.Mock).mockResolvedValue({
        id: "req_app_user1", team_id: "teamA", status: "pending", direction: "user_to_team", requester_id: "user1"
      });

      await testApiHandler({
        appHandler: cancelHandler,
        params: { id: "req_app_user1" } as any,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "DELETE" });
          expect(res.status).toBe(200);
          expect(prisma.joinRequest.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: "req_app_user1" },
              data: expect.objectContaining({ status: "cancelled" })
            })
          );
        },
      });
    });
  });

  describe("GET /api/join-requests", () => {
    test("fetches outbound invites when user is leader on the second membership (index 1)", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_multi" } }, error: null });
      
      // User with two memberships. Member of Team A, Leader of Team B.
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "multi_user",
        team_memberships: [
          { team_id: "teamA", role: "member" }, // index 0 is not a leader
          { team_id: "teamB", role: "leader" }  // index 1 IS a leader
        ]
      });

      // Mock the outbound invites query to return something
      (prisma.joinRequest.findMany as jest.Mock).mockImplementation((args) => {
        if (args.where?.direction === "team_to_user" && args.where?.team_id?.in?.includes("teamB")) {
          return Promise.resolve([{ id: "invite_team_b", team_id: "teamB", direction: "team_to_user" }]);
        }
        return Promise.resolve([]);
      });

      await testApiHandler({
        appHandler: requestsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: "GET" });
          expect(res.status).toBe(200);
          const json = await res.json();
          
          expect(prisma.joinRequest.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                direction: "team_to_user",
                team_id: { in: ["teamB"] }
              })
            })
          );
          
          expect(json.outboundInvites).toHaveLength(1);
          expect(json.outboundInvites[0].id).toBe("invite_team_b");
        },
      });
    });
  });
});
