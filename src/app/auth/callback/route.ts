import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Supabase OAuth callback handler.
 * Exchanges the one-time code for a user session and redirects to the
 * appropriate page based on ?path= query param. First-time users without
 * a completed profile are routed to /profile/complete.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const path = searchParams.get("path") ?? "join"; // "join" | "create"
  const next = searchParams.get("next") ?? (path === "create" ? "/teams/create" : "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const profile = await prisma.user.findUnique({
        where: { auth_user_id: data.user.id },
        select: { id: true },
      });
      if (!profile) {
        return NextResponse.redirect(
          `${origin}/profile/complete?path=${path}`
        );
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth failed — send to error page with message
  return NextResponse.redirect(`${origin}/auth/error`);
}
