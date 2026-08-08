/* eslint-disable @typescript-eslint/no-explicit-any */
import { testApiHandler } from "next-test-api-route-handler";
import * as teamDetailHandler from "@/app/api/teams/[id]/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/prisma", () => {
  const mockP = {
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn(), update: jest.fn() },
    event: { findUnique: jest.fn() },
    teamSlot: { count: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  };
  mockP.$transaction = jest.fn((callback) => callback(mockP));
  return { prisma: mockP };
});

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("PATCH /api/teams/[id]", () => {
  let mockAuthGetUser: jest.Mock;

  const baseTeam = {
    id: "team1",
    leader_id: "db_user1",
    event_id: "event1",
    name: "Old Name",
    description: null,
    domain_interest: null,
    status: "open",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  test("returns 401 if unauthorized", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ name: "X" }) });
        expect(res.status).toBe(401);
      },
    });
  });

  test("returns 404 if team not found", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(null);

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ name: "X" }) });
        expect(res.status).toBe(404);
        const data = await res.json();
        expect(data.error).toBe("Team not found");
      },
    });
  });

  test("returns 403 if user is not the team leader", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue({ ...baseTeam, leader_id: "someone_else" });

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ name: "X" }) });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toBe("Only the team leader can edit team specifications");
      },
    });
  });

  test("updates name, description and domain for the leader", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);
    (prisma.team.update as jest.Mock).mockResolvedValue({ ...baseTeam, name: "New Name" });

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ name: "New Name", description: "New mission", domain_interest: "Web3" }),
        });
        expect(res.status).toBe(200);

        expect(prisma.team.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "team1" },
            data: { name: "New Name", description: "New mission", domain_interest: "Web3" },
          })
        );
      },
    });
  });

  test("manages open slots: deletes removed, updates existing, creates new, recomputes skills_needed", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "event1", team_size_max: 6 });
    (prisma.teamSlot.count as jest.Mock).mockResolvedValue(1); // leader's filled slot
    // First findMany: existing open slots. Second findMany (recompute): final skills.
    (prisma.teamSlot.findMany as jest.Mock)
      .mockResolvedValueOnce([{ id: "s1" }, { id: "s2" }])
      .mockResolvedValueOnce([{ skills: ["React"] }, { skills: ["Node"] }]);

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            slots: [
              { id: "s1", role_title: "Frontend Dev", gender: "any", skills: ["React"] },
              { role_title: "Backend Dev", gender: "female", skills: ["Node"] },
            ],
          }),
        });
        expect(res.status).toBe(200);

        // Slot s2 was not submitted -> deleted
        expect(prisma.teamSlot.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["s2"] } } });
        // Existing slot s1 updated
        expect(prisma.teamSlot.update).toHaveBeenCalledWith({
          where: { id: "s1" },
          data: { role_title: "Frontend Dev", gender: "any", skills: ["React"], is_filled: false },
        });
        // New slot created
        expect(prisma.teamSlot.create).toHaveBeenCalledWith({
          data: { team_id: "team1", role_title: "Backend Dev", gender: "female", skills: ["Node"], is_filled: false },
        });
        // skills_needed recomputed from final open slots
        expect(prisma.team.update).toHaveBeenCalledWith({
          where: { id: "team1" },
          data: { skills_needed: ["React", "Node"] },
        });
      },
    });
  });

  test("rejects invalid slot gender", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);
    (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "event1", team_size_max: 6 });
    (prisma.teamSlot.count as jest.Mock).mockResolvedValue(1);

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ slots: [{ role_title: "X", gender: "alien" }] }),
        });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("Invalid slot gender");
      },
    });
  });

  test("returns 409 when the new team name is already taken", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(baseTeam);
    (prisma.team.update as jest.Mock).mockRejectedValue({
      code: "P2002",
      meta: { target: ["name"] },
      message: "Unique constraint failed",
    });

    await testApiHandler({
      appHandler: teamDetailHandler,
      params: { id: "team1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({ name: "Taken" }) });
        expect(res.status).toBe(409);
        const data = await res.json();
        expect(data.error).toContain("already exists");
      },
    });
  });
});
