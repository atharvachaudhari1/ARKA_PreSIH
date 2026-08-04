import { testApiHandler } from "next-test-api-route-handler";
import * as appHandler from "@/app/api/admin/verifications/[userId]/id-card/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("GET /api/admin/verifications/[userId]/id-card", () => {
  let mockAuthGetUser: jest.Mock;
  let mockStorageCreateSignedUrl: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    mockStorageCreateSignedUrl = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
      storage: {
        from: jest.fn().mockReturnValue({
          createSignedUrl: mockStorageCreateSignedUrl,
        }),
      },
    });
  });

  test("returns 403 Forbidden for non-admin users", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "user1" } }, error: null });
    // Simulate non-admin
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ is_admin: false });

    await testApiHandler({
      appHandler,
      params: { userId: "target-user" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(403);
        const data = await res.json();
        expect(data.error).toMatch(/Forbidden/);
      },
    });
  });

  test("returns signed URL for admins and specifies a short timeout", async () => {
    mockAuthGetUser.mockResolvedValue({ data: { user: { id: "admin1" } }, error: null });
    // First call is for admin check, second call is for target user's storage path
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ is_admin: true })
      .mockResolvedValueOnce({ id_card_storage_path: "path/to/id.jpg" });

    mockStorageCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://signed.url/id.jpg?token=abc" },
      error: null,
    });

    await testApiHandler({
      appHandler,
      params: { userId: "target-user" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" });
        expect(res.status).toBe(200);
        const data = await res.json();
        
        expect(data.signedUrl).toBe("https://signed.url/id.jpg?token=abc");
        
        // Assert the timeout passed to createSignedUrl is 5 minutes (300 seconds)
        expect(mockStorageCreateSignedUrl).toHaveBeenCalledWith("path/to/id.jpg", 300);
      },
    });
  });
});
