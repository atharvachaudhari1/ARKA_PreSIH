import * as chatHandler from "@/app/api/teams/[id]/chat/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    chatMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("Chat API", () => {
  let mockAuthGetUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthGetUser = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: mockAuthGetUser },
    });
  });

  describe("GET /api/teams/:id/chat", () => {
    test("rejects non-members with 403 Forbidden", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        team_memberships: [{ team_id: "other_team" }], // Not in the requested team
      });

      const req = new NextRequest("http://localhost/api/teams/team1/chat");
      const res = await chatHandler.GET(req, { params: Promise.resolve({ id: "team1" }) });
      expect(res.status).toBe(403);
      expect(prisma.chatMessage.findMany).not.toHaveBeenCalled();
    });

    test("allows members to fetch chat", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        team_memberships: [{ team_id: "team1" }],
      });
      (prisma.chatMessage.findMany as jest.Mock).mockResolvedValue([{ id: "msg1", content: "hello" }]);

      const req = new NextRequest("http://localhost/api/teams/team1/chat");
      const res = await chatHandler.GET(req, { params: Promise.resolve({ id: "team1" }) });
      expect(res.status).toBe(200);
      expect(prisma.chatMessage.findMany).toHaveBeenCalled();
    });
  });

  describe("POST /api/teams/:id/chat", () => {
    test("rejects non-members with 403 Forbidden", async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: "auth_user_1" } }, error: null });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: "user1",
        team_memberships: [], 
      });

      const req = new NextRequest("http://localhost/api/teams/team1/chat", {
        method: "POST",
        body: JSON.stringify({ content: "hello" })
      });
      const res = await chatHandler.POST(req, { params: Promise.resolve({ id: "team1" }) });
      expect(res.status).toBe(403);
      expect(prisma.chatMessage.create).not.toHaveBeenCalled();
    });
  });
});
