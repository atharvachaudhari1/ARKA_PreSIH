import { middleware } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Mock Supabase SSR
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

describe("Auth Middleware (NFR6)", () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    };
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  const createMockRequest = (pathname: string) => {
    const url = new URL(`http://localhost:3000${pathname}`);
    const req = new NextRequest(url);
    // Add mock properties if needed
    return req;
  };

  test("allows access to public routes without auth", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = createMockRequest("/login");
    const res = await middleware(req);

    // Should return NextResponse.next()
    expect(res).toBeDefined();
    expect(res?.status).not.toBe(307); // Not redirected
  });

  test("redirects unauthenticated users from protected app routes to /login", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = createMockRequest("/dashboard");
    const res = await middleware(req);

    expect(res).toBeDefined();
    expect(res?.status).toBe(307); // Redirect status
    expect(res?.headers.get("location")).toBe("http://localhost:3000/login?redirectedFrom=%2Fdashboard");
  });

  test("returns 401 for unauthenticated API routes", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } });

    const req = createMockRequest("/api/users/profile");
    const res = await middleware(req);

    expect(res).toBeDefined();
    expect(res?.status).toBe(401);
  });

  test("allows authenticated users to access protected routes", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: { id: "user1" } } });

    const req = createMockRequest("/dashboard");
    const res = await middleware(req);

    expect(res).toBeDefined();
    expect(res?.status).not.toBe(307);
    expect(res?.status).not.toBe(401);
  });
});
