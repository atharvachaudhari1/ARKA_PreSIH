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
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
    joinRequest: { findFirst: jest.fn() },
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

    test("filters out and deletes read outcome notifications from the feed", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { id: "n1", user_id: "user1", type: "request_accepted", read_status: "read" },
        { id: "n2", user_id: "user1", type: "new_join_request", read_status: "read", team_id: null },
      ]);
      (prisma.joinRequest.findFirst as jest.Mock).mockResolvedValue({ id: "jr1" });

      const req = new NextRequest("http://localhost/api/notifications");
      const res = await notificationsHandler.GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.notifications.map((n: any) => n.id)).toEqual(["n2"]);
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["n1"] } }
      });
    });

    test("keeps read request_expired_other_team_joined notifications in the feed", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        { id: "n1", user_id: "user1", type: "request_expired_other_team_joined", read_status: "read", team_id: "t1" },
        { id: "n2", user_id: "user1", type: "request_rejected", read_status: "read", team_id: "t1" },
        { id: "n3", user_id: "user1", type: "request_expired_other_team_joined", read_status: "unread", team_id: "t1" },
      ]);

      const req = new NextRequest("http://localhost/api/notifications");
      const res = await notificationsHandler.GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      const ids = body.notifications.map((n: any) => n.id);
      // expired notifications survive (both read and unread); rejected is deleted
      expect(ids).toEqual(["n1", "n3"]);
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ["n2"] } }
      });
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

    test("deletes an outcome notification instead of keeping it as read", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: "n1",
        user_id: "user1",
        type: "request_accepted",
      });
      (prisma.notification.delete as jest.Mock).mockResolvedValue({ id: "n1", user_id: "user1", type: "request_accepted" });

      const req = new NextRequest("http://localhost/api/notifications/n1/read", { method: "PATCH" });
      const res = await readHandler.PATCH(req, { params: { id: "n1" } as any });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.removed).toBe(true);
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    test("team_now_full outcome notification is deleted once read", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: "n1",
        user_id: "user1",
        type: "team_now_full",
      });
      (prisma.notification.delete as jest.Mock).mockResolvedValue({ id: "n1", user_id: "user1", type: "team_now_full" });

      const req = new NextRequest("http://localhost/api/notifications/n1/read", { method: "PATCH" });
      const res = await readHandler.PATCH(req, { params: { id: "n1" } as any });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.removed).toBe(true);
      expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
    });

    test("request_expired_other_team_joined is marked read, NOT deleted", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        id: "n1",
        user_id: "user1",
        type: "request_expired_other_team_joined",
        read_status: "unread",
      });
      (prisma.notification.update as jest.Mock).mockResolvedValue({
        id: "n1",
        user_id: "user1",
        type: "request_expired_other_team_joined",
        read_status: "read",
      });

      const req = new NextRequest("http://localhost/api/notifications/n1/read", { method: "PATCH" });
      const res = await readHandler.PATCH(req, { params: { id: "n1" } as any });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.removed).toBe(false);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { read_status: "read" }
      });
      expect(prisma.notification.delete).not.toHaveBeenCalled();
    });
  });

  describe("read-all flow keeps request_expired_other_team_joined", () => {
    test("marks all read while only deleting outcome types (not expired)", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1" });

      const readAllHandler = (await import("@/app/api/notifications/read-all/route")).PATCH;
      const res = await readAllHandler();
      expect(res.status).toBe(200);

      // deleteMany must only target outcome types (which no longer includes expired)
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          user_id: "user1",
          type: { in: ["request_accepted", "request_rejected", "team_now_full"] },
        },
      });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { user_id: "user1", read_status: "unread" },
        data: { read_status: "read" },
      });
    });
  });
});
