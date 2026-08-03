import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TeamUp — Find Your Hackathon Team",
  description:
    "The verified teammate-matching platform for Smart India Hackathon. Join a team or build one — all verified, all semi-anonymous.",
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-base)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Nav ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.25rem 2rem",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11, 13, 20, 0.85)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "var(--color-text-primary)",
          }}
        >
          <span style={{ color: "var(--color-brand-light)" }}>{"<"}</span>
          TeamUp
          <span style={{ color: "var(--color-brand-light)" }}>{"/>"}</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/login" className="btn btn-ghost btn-sm">
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "5rem 1.25rem 4rem",
          maxWidth: "860px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid var(--color-border-brand)",
            borderRadius: "var(--radius-full)",
            padding: "0.35rem 1rem",
            marginBottom: "2rem",
            animation: "fade-up 0.4s ease forwards",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
              display: "inline-block",
              animation: "pulse-dot 2s ease infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-brand-light)",
              fontWeight: 500,
            }}
          >
            SIH 2026 · Team formation is open
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            animation: "fade-up 0.4s ease 0.1s both forwards",
          }}
        >
          Stop broadcasting.{" "}
          <span className="gradient-text">Start matching.</span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--color-text-secondary)",
            maxWidth: "580px",
            marginBottom: "2.5rem",
            lineHeight: 1.7,
            animation: "fade-up 0.4s ease 0.2s both forwards",
          }}
        >
          TeamUp replaces the WhatsApp DM chaos with a verified, semi-anonymous
          platform. Browse real teams, see who&apos;s on them — and apply
          without your name being broadcast to the whole group.
        </p>

        {/* ── Dual CTA — Devfolio-style ── */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fade-up 0.4s ease 0.3s both forwards",
          }}
        >
          <Link
            href="/signup?path=join"
            className="btn btn-primary btn-lg"
            style={{ minWidth: "200px" }}
            id="cta-join-team"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Join a Team
          </Link>
          <Link
            href="/signup?path=create"
            className="btn btn-secondary btn-lg"
            style={{ minWidth: "200px" }}
            id="cta-create-team"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Create a Team
          </Link>
        </div>

        {/* Trust line */}
        <p
          style={{
            marginTop: "1.5rem",
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            animation: "fade-up 0.4s ease 0.4s both forwards",
          }}
        >
          College ID verified · No guest access · Leader contact always public
        </p>
      </section>

      {/* ── Live stats bar ── */}
      <section
        style={{
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-surface)",
          padding: "2rem 1.25rem",
        }}
      >
        <div
          className="page-container"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "2rem",
          }}
        >
          {[
            { value: "—", label: "Teams open" },
            { value: "—", label: "Spots available" },
            { value: "—", label: "Members verified" },
            { value: "6", label: "Max team size (SIH)" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{ padding: "5rem 1.25rem" }}
      >
        <div className="page-container">
          <p className="section-title" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            $ cat how-it-works.md
          </p>
          <h2
            style={{
              textAlign: "center",
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "3rem",
            }}
          >
            Two paths. One platform.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Path A — Join */}
            <div className="card card-brand" style={{ padding: "2rem" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(99,102,241,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-brand-light)"
                  strokeWidth="2"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
                Looking to join?
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                Browse verified teams, see who&apos;s already on them, and check their
                skill gaps. Request to join — your profile is only shared with
                that team, not the whole platform.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Browse teams", "Filter by skill", "Private application"].map(
                  (t) => (
                    <span key={t} className="skill-chip">
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Path B — Create */}
            <div className="card" style={{ padding: "2rem" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: "rgba(245,158,11,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.25rem",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-amber)"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              </div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
                Building a team?
              </h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                Create your team, define the skills you need, and become the
                leader. Invite people or let them find you — your whole team
                votes on applicants, you make the call.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Team leader", "Skill matching", "Consensus voting"].map(
                  (t) => (
                    <span key={t} className="skill-chip">
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Transparency model explainer ── */}
      <section
        style={{
          background: "var(--color-bg-surface)",
          padding: "5rem 1.25rem",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="page-container" style={{ maxWidth: "800px" }}>
          <p className="section-title" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            $ cat transparency.md
          </p>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
            Semi-anonymous by design
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "var(--color-text-secondary)",
              marginBottom: "3rem",
            }}
          >
            You can verify a team&apos;s credibility before applying. They can&apos;t see
            who else you&apos;re applying to.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                icon: "✅",
                label: "Team structure",
                desc: "Skills needed, vacancy count, domain — visible to everyone.",
              },
              {
                icon: "✅",
                label: "Leader identity",
                desc: "Name, phone, LinkedIn — always public so you can verify they're real.",
              },
              {
                icon: "✅",
                label: "Existing members",
                desc: "Name, department, skills — public. Contact info stays private.",
              },
              {
                icon: "🔒",
                label: "Your application",
                desc: "Your profile is shared only with the specific team you apply to.",
              },
              {
                icon: "🔒",
                label: "Your other applications",
                desc: "Teams never know who else you're applying to.",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                }}
              >
                <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>
                  {row.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                    {row.label}
                  </div>
                  <div
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {row.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          padding: "5rem 1.25rem",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "1rem" }}>
          Ready? Your team is waiting.
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "2rem",
            fontSize: "1.05rem",
          }}
        >
          Sign up in 60 seconds. Verified. No spam. No public profiles until you
          choose.
        </p>
        <Link href="/signup" className="btn btn-primary btn-lg" id="cta-final">
          Create your account →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "2rem 1.25rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontSize: "0.8rem",
        }}
      >
        <div className="page-container">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "var(--color-text-secondary)",
            }}
          >
            <span style={{ color: "var(--color-brand-light)" }}>{"<"}</span>
            TeamUp
            <span style={{ color: "var(--color-brand-light)" }}>{"/>"}</span>
          </div>
          <p>Built for SIH 2026 · Semi-anonymous team matching · All verified</p>
        </div>
      </footer>
    </main>
  );
}
