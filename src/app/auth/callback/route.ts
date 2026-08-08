import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback — handles every OAuth / email-confirmation / magic-link
 * redirect back into the app.
 *
 * Every Supabase sign-in flow in this app uses PKCE: @supabase/ssr's
 * createBrowserClient forces `flowType: "pkce"`, so the callback always arrives
 * as a GET with `?code=...` in the query string. A server route can exchange
 * that code and write the session cookie on THIS response — no client-side
 * token processing needed.
 *
 * Doing the exchange server-side (instead of a client page that calls
 * window.location.assign afterwards) guarantees the session cookie exists on
 * the very next request. That is what lands the user in the app after a SINGLE
 * provider round-trip instead of requiring the Google flow twice.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const path = searchParams.get("path") ?? "join"; // "join" | "create"
  const next =
    searchParams.get("next") ??
    (path === "create" ? "/teams/create" : "/dashboard");

  const supabase = await createClient();

  let user = null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) user = data.session?.user ?? null;
  }

  // The provider may also have told us the user cancelled/denied consent
  // (?error=access_denied), or the exchange failed because the one-time code
  // was already used (e.g. the browser re-requested the callback). If a valid
  // session already exists, route the user through instead of bouncing them
  // back to sign-in.
  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
      select: { id: true },
    });
    // First-time users must finish onboarding before entering the app. The
    // path param preserves the join/create intent across the redirect.
    if (!dbUser) {
      return NextResponse.redirect(
        `${origin}/profile/complete?path=${encodeURIComponent(path)}`
      );
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
