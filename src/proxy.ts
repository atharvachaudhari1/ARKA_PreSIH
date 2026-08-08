import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (formerly Middleware) — runs on every request.
 * 1. Refreshes the Supabase auth session (keeps JWT fresh).
 * 2. Enforces "no anonymous access anywhere" (NFR6):
 *    - Public routes: /login, /signup, /auth/callback, /auth/error
 *    - Everything else requires a logged-in session → redirect to /login.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public-only routes (unauthenticated users only).
  const publicRoutes = ["/login", "/signup", "/auth/callback", "/auth/error"];
  const isPublicRoute = pathname === "/" || publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // API routes that must be callable WITHOUT a session.
  // /api/auth/verify-password is step 1 of email login (password check happens
  // server-side before any session exists) — blocking it here breaks login.
  const publicApiRoutes = ["/api/auth/verify-password"];
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If not authenticated and trying to access a protected route → redirect to /login.
  if (!user && !isPublicRoute && !isPublicApiRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and hitting a public route → redirect to /dashboard.
  // NOTE: `/` (the marketing landing page) is included here too — a successful
  // login must NEVER leave the user staring at the logged-out landing page.
  // /auth/callback is excluded because it must finish the OAuth code exchange.
  if (user && isPublicRoute && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
