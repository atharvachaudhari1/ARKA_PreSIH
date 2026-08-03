import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";

/**
 * Shared layout for all protected (app) routes.
 * Checks:
 * 1. User is authenticated (belt-and-suspenders over middleware).
 * 2. User has a profile — if not (e.g. first Google OAuth login),
 *    redirect to /profile/complete to finish onboarding.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if profile exists
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?auth_user_id=eq.${user.id}&select=id`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
    }
  );
  const rows = await res.json();
  const hasProfile = Array.isArray(rows) && rows.length > 0;

  if (!hasProfile) {
    redirect("/profile/complete");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <AppNavbar userEmail={user.email ?? ""} />
      {children}
    </div>
  );
}
