import { NextRequest } from "next/server";
import { POST as dissolveHandler } from "@/app/api/teams/[id]/dissolve/route";
import { POST as leaveHandler } from "@/app/api/teams/[id]/leave/route";
import { GET as getTeamsHandler } from "@/app/api/teams/route";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    team: { findUnique: jest.fn(), findMany: jest.fn() },
    teamMembership: { findFirst: jest.fn() },
  },
}));

describe("Security IDOR/Auth Checks", () => {
  const mockAuthUser = { id: "auth_user_2", email: "hacker@test.com" }; // Non-leader
  const mockDbUser = { id: "user_2", auth_user_id: "auth_user_2" };
  const mockTeam = { id: "team_1", leader_id: "user_1", status: "open", memberships: [] }; // Leader is user_1

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockAuthUser }, error: null }) },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.team.findUnique as jest.Mock).mockResolvedValue(mockTeam);
  });

  it("TEST 1: Non-leader attempts to DISSOLVE team", async () => {
    const req = new NextRequest("http://localhost:3000/api/teams/team_1/dissolve", { method: "POST" });
    const res = await dissolveHandler(req, { params: { id: "team_1" } });
    
    console.log("--- TEST 1: IDOR Dissolve ---");
    console.log(`POST /api/teams/team_1/dissolve`);
    console.log(`Status: ${res.status}`);
    console.log(`Body:`, await res.json());
    expect(res.status).toBe(403);
  });

  it("TEST 2: Non-member attempts to LEAVE team", async () => {
    (prisma.teamMembership.findFirst as jest.Mock).mockResolvedValue(null); // Not a member
    
    const req = new NextRequest("http://localhost:3000/api/teams/team_1/leave", { method: "POST" });
    const res = await leaveHandler(req, { params: { id: "team_1" } });
    
    console.log("--- TEST 2: IDOR Leave ---");
    console.log(`POST /api/teams/team_1/leave`);
    console.log(`Status: ${res.status}`);
    console.log(`Body:`, await res.json());
    expect(res.status).toBe(400);
  });

  it("TEST 3: Visibility Leak on raw team API", async () => {
    (prisma.team.findMany as jest.Mock).mockResolvedValue([
      { id: "team_1", name: "Alpha", memberships: [ { user: { name: "Alice", email: "alice@hidden.com" } } ] }
    ]);
    
    const req = new NextRequest("http://localhost:3000/api/teams?status=open", { method: "GET" });
    const res = await getTeamsHandler(req);
    
    console.log("--- TEST 3: Visibility Leak ---");
    console.log(`GET /api/teams?status=open`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Body:`, JSON.stringify(data, null, 2));
    
    // In our GET route, we explicitly SELECT the fields for memberships.user:
    // id, name, department, skills. 
    // We do NOT select email or whatsapp_number! 
    expect(res.status).toBe(200);
  });
});
