import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Should be caught by middleware, but belt-and-suspenders
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)" }}>
      {/* ── Navbar ── */}
      <DashboardNav userEmail={user.email ?? ""} />

      {/* ── Content ── */}
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
          <p className="section-title" style={{ marginBottom: "0.5rem" }}>
            $ whoami
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Welcome back 👋
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            {user.email} · SIH 2026
          </p>
        </div>

        {/* Quick actions — Devfolio-style dual path */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          <Link
            href="/teams"
            id="dash-browse-teams"
            style={{ textDecoration: "none" }}
          >
            <div
              className="card card-brand"
              style={{ height: "100%", cursor: "pointer" }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                Browse Teams
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Find your team — filter by skills, vacancy, gender requirement, and more.
              </p>
            </div>
          </Link>

          <Link
            href="/teams/create"
            id="dash-create-team"
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ height: "100%", cursor: "pointer" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚡</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                Create a Team
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Start a new team and become the leader. Define your skills needed and recruit.
              </p>
            </div>
          </Link>

          <Link
            href="/profile"
            id="dash-my-profile"
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ height: "100%", cursor: "pointer" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👤</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                My Profile
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Update your skills, bio, and contact info. Check your verification status.
              </p>
            </div>
          </Link>

          <Link
            href="/requests"
            id="dash-my-requests"
            style={{ textDecoration: "none" }}
          >
            <div className="card" style={{ height: "100%", cursor: "pointer" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📨</div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.4rem" }}>
                My Requests
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Track your join requests and invites — pending, accepted, or rejected.
              </p>
            </div>
          </Link>
        </div>

        {/* Placeholder — activity feed (Phase 4) */}
        <div
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p className="section-title" style={{ marginBottom: "0.5rem" }}>
            $ tail -f activity.log
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            Activity feed coming in Phase 4 — notifications will appear here in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Navbar (server-rendered) ──
function DashboardNav({ userEmail }: { userEmail: string }) {
  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--color-border)",
        background: "rgba(11,13,20,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "var(--color-text-primary)",
        }}
      >
        <span style={{ color: "var(--color-brand-light)" }}>{"<"}</span>
        TeamUp
        <span style={{ color: "var(--color-brand-light)" }}>{"/>"}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href="/teams"
          style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}
        >
          Browse
        </Link>
        <Link
          href="/notifications"
          style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.875rem" }}
        >
          Notifications
        </Link>
        <div
          style={{
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            padding: "0.3rem 0.75rem",
            fontSize: "0.8rem",
            color: "var(--color-text-secondary)",
          }}
        >
          {userEmail}
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            id="btn-signout"
          >
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
