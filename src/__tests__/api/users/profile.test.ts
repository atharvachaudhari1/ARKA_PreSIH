import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/users/profile/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("PATCH /api/users/profile", () => {
  let mockAuthGetUser: jest.Mock;

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
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: JSON.stringify({}) });
        expect(res.status).toBe(401);
      },
    });
  });

  test("rejects invalid JSON", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "PATCH", body: "not-json" });
        expect(res.status).toBe(400);
      },
    });
  });

  test("rejects invalid contact_visibility enum", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({ contact_visibility: "invalid_value" }),
        });
        expect(res.status).toBe(400);
      },
    });
  });

  test("strips protected fields and only updates whitelisted fields", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "db_user1" });
    
    const mockUpdatedUser = { id: "db_user1", name: "New Name", led_teams: [] };
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

    await testApiHandler({
      appHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          body: JSON.stringify({
            name: "New Name",
            id_card_storage_path: "hacked/path.png", // SHOULD BE STRIPPED
            verification_status: "verified", // SHOULD BE STRIPPED
            is_admin: true, // MUST BE STRIPPED (Mass assignment protection)
          }),
        });
        expect(res.status).toBe(200);
        
        // Assert that prisma.user.update was called WITHOUT the protected fields
        expect(prisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "db_user1" },
            data: { name: "New Name" }, // No id_card_storage_path, verification_status, or is_admin
          })
        );
      },
    });
  });
});
