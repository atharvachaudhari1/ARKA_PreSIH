import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { auth_user_id: user.id },
    select: { name: true, verification_status: true, team_memberships: { select: { role: true, team: { select: { id: true, name: true, status: true } } } } },
  });

  const myTeam = profile?.team_memberships?.[0];

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      {/* Welcome banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
          border: "1px solid var(--color-border-brand)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          marginBottom: "2rem",
          animation: "fade-up 0.4s ease forwards",
        }}
      >
        <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ whoami</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Welcome back, {profile?.name?.split(" ")[0] ?? "hacker"} 👋
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{user.email}</span>
          {profile?.verification_status === "pending" && (
            <span className="badge badge-unverified">ID verification pending</span>
          )}
          {profile?.verification_status === "verified" && (
            <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 600 }}>✓ Verified</span>
          )}
        </div>
      </div>

      {/* My team card (if in one) */}
      {myTeam && (
        <div className="card card-brand" style={{ marginBottom: "2rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>YOUR TEAM</p>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{myTeam.team.name}</h2>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem" }}>
                <span className={`badge badge-${myTeam.team.status}`}>{myTeam.team.status}</span>
                {myTeam.role === "leader" && <span className="badge" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}>Leader</span>}
              </div>
            </div>
            <Link href={`/teams/${myTeam.team.id}`} className="btn btn-primary btn-sm">Manage →</Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
        <QuickCard href="/teams" emoji="🔍" title="Browse Teams" desc="Filter by skills, vacancy, and gender requirement." id="dash-browse" />
        <QuickCard href="/teams/create" emoji="⚡" title="Create a Team" desc="Start a team and become the leader." id="dash-create" />
        <QuickCard href="/profile" emoji="👤" title="My Profile" desc="Update skills, contact info, and presentation rating." id="dash-profile" />
        <QuickCard href="/requests" emoji="📨" title="My Requests" desc="Track join requests — pending, accepted, rejected." id="dash-requests" />
      </div>

      {/* Activity feed placeholder */}
      <div style={{ background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center" }}>
        <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ tail -f activity.log</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          Real-time activity feed arrives in Phase 4.
        </p>
      </div>
    </div>
  );
}

function QuickCard({ href, emoji, title, desc, id }: { href: string; emoji: string; title: string; desc: string; id: string }) {
  return (
    <Link href={href} id={id} style={{ textDecoration: "none" }}>
      <div className="card" style={{ height: "100%", cursor: "pointer" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>{emoji}</div>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.4rem" }}>{title}</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </Link>
  );
}
