import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/users/skills/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userSkill: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("POST/DELETE /api/users/skills", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe("POST /api/users/skills", () => {
    test("rejects invalid proficiency enum", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ skill: "React", proficiency: "master" }), // 'master' is not valid
          });
          expect(res.status).toBe(400);
          const data = await res.json();
          expect(data.error).toMatch(/proficiency must be one of/);
        },
      });
    });

    test("upserts skill correctly", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
      (prisma.userSkill.upsert as jest.Mock).mockResolvedValue({ skill: "React", proficiency: "advanced" });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "POST",
            body: JSON.stringify({ skill: "React ", proficiency: "advanced" }), // Notice trailing space
          });
          expect(res.status).toBe(201);
          
          expect(prisma.userSkill.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { user_id_skill: { user_id: "db_user1", skill: "React" } }, // Trimmed
              create: { user_id: "db_user1", skill: "React", proficiency: "advanced" },
              update: { proficiency: "advanced" },
            })
          );
        },
      });
    });
  });

  describe("DELETE /api/users/skills", () => {
    test("deletes skill correctly", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
      (prisma.userSkill.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: "DELETE",
            body: JSON.stringify({ skill: "React" }),
          });
          expect(res.status).toBe(200);
          
          expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
            where: { user_id: "db_user1", skill: "React" },
          });
        },
      });
    });
  });
});
