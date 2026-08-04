/* eslint-disable @typescript-eslint/no-explicit-any */
import * as notificationsHandler from "@/app/api/notifications/route";
import * as readHandler from "@/app/api/notifications/[id]/read/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Notifications API", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe("GET /api/notifications", () => {
    test("fetches only notifications for the current user", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([{ id: "n1", user_id: "user1" }]);

      const req = new NextRequest("http://localhost/api/notifications");
      const res = await notificationsHandler.GET(req);
      expect(res.status).toBe(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: "user1" }
        })
      );
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    test("rejects attempts to read another user's notification", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: "n2",
        user_id: "user2", // Belongs to someone else
      });

      const req = new NextRequest("http://localhost/api/notifications/n2/read", { method: "PATCH" });
      const res = await readHandler.PATCH(req, { params: { id: "n2" } as any });
      expect(res.status).toBe(403);
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    test("allows user to read their own notification", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: "n1",
        user_id: "user1",
      });

      const req = new NextRequest("http://localhost/api/notifications/n1/read", { method: "PATCH" });
      const res = await readHandler.PATCH(req, { params: { id: "n1" } as any });
      expect(res.status).toBe(200);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "n1" },
          data: { read_status: "read" }
        })
      );
    });
  });
});
