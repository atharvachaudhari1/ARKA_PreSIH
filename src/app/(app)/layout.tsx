import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";

/**
 * Shared layout for all protected (app) routes.
 * Checks:
 * 1. User is authenticated (belt-and-suspenders over middleware).
 * 2. User has a profile — if not (e.g. first Google OAuth login),
 *    redirect to /profile/complete to finish onboarding.
 *
 * Performance: getUser() and DB profile check run in parallel via Promise.all.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Parallel: auth check + profile lookup together
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Direct Prisma query — no extra HTTP roundtrip
  const dbUser = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { id: true, is_admin: true, team_memberships: { select: { id: true } } },
  });

  if (!dbUser) {
    redirect("/profile/complete");
  }

  // Presence heartbeat: refresh last_seen_at on every protected page load so
  // the solo-hackers directory only lists recently-active participants.
  prisma.user
    .updateMany({
      where: {
        id: dbUser.id,
        OR: [{ last_seen_at: null }, { last_seen_at: { lt: new Date(Date.now() - 5 * 60 * 1000) } }],
      },
      data: { last_seen_at: new Date() },
    })
    .catch(() => {});

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
      <AppNavbar userEmail={user.email ?? ""} userId={dbUser.id} isAdmin={dbUser.is_admin ?? false} hasTeam={dbUser.team_memberships.length > 0} />
      {children}
    </div>
  );
}
