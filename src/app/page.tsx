import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TeamUp — Find Your Hackathon Team",
  description:
    "The verified teammate-matching platform for Smart India Hackathon. Join a team or build one — all verified, all semi-anonymous.",
};

// ── Inline SVG Icons ─────────────────────────────────────────────────────────
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconPlusCircle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="16"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

export default function HomePage() {
  const transparencyItems = [
    { icon: <IconCheck />, color: "#34d399", label: "Team structure", desc: "Skills needed, vacancy count, domain — visible to everyone." },
    { icon: <IconCheck />, color: "#34d399", label: "Leader identity", desc: "Name, phone, LinkedIn — always public so you can verify they're real." },
    { icon: <IconCheck />, color: "#34d399", label: "Existing members", desc: "Name, department, skills — public. Contact info stays private." },
    { icon: <IconLock />, color: "var(--ember-coral)", label: "Your application", desc: "Your profile is shared only with the specific team you apply to." },
    { icon: <IconLock />, color: "var(--ember-coral)", label: "Your other applications", desc: "Teams never know who else you're applying to." },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", flexDirection: "column" }}>

      {/* ── Ambient glows ── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(65,67,106,0.55) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "30%", right: "-15%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(152,64,99,0.22) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "20%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(246,70,104,0.10) 0%, transparent 70%)",
        }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(28,30,48,0.85)",
        backdropFilter: "blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {/* Ember logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--gradient-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 16px rgba(246,70,104,0.4)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
            Team<span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Up</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "5rem 1.25rem 4rem",
        maxWidth: 860, margin: "0 auto", width: "100%",
        position: "relative", zIndex: 1,
      }}>
        {/* Eyebrow pill */}
        <div className="animate-fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          background: "rgba(246,70,104,0.08)",
          border: "1px solid rgba(246,70,104,0.25)",
          borderRadius: "var(--radius-full)", padding: "0.35rem 1.1rem",
          marginBottom: "2.25rem",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ember-coral)", display: "inline-block", animation: "pulse-dot 2s ease infinite" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.73rem", color: "var(--ember-peach)", fontWeight: 500, letterSpacing: "0.06em" }}>
            SIH 2026 · Team formation is open
          </span>
        </div>

        <h1 className="animate-fade-up delay-100" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: "1.5rem", letterSpacing: "-0.03em" }}>
          Stop broadcasting.{" "}
          <span className="gradient-text">Start matching.</span>
        </h1>

        <p className="animate-fade-up delay-200" style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", maxWidth: 560, marginBottom: "2.75rem", lineHeight: 1.75 }}>
          TeamUp replaces WhatsApp chaos with a verified, semi-anonymous platform.
          Browse real teams, see who&apos;s on them — apply without broadcasting yourself to the whole group.
        </p>

        <div className="animate-fade-up delay-300" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/signup?path=join" className="btn btn-primary btn-lg" style={{ minWidth: 200, gap: "0.6rem" }} id="cta-join-team">
            <IconUsers />
            Join a Team
          </Link>
          <Link href="/signup?path=create" className="btn btn-wine btn-lg" style={{ minWidth: 200, gap: "0.6rem" }} id="cta-create-team">
            <IconPlusCircle />
            Create a Team
          </Link>
        </div>

        <p className="animate-fade-up delay-400" style={{ marginTop: "1.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
          College ID verified · No guest access · Leader contact always public
        </p>
      </section>

      {/* ── Stats bar ── */}
      <section style={{
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg-surface)",
        padding: "2.5rem 1.25rem",
        position: "relative", zIndex: 1,
      }}>
        <div className="page-container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "2rem" }}>
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
      <section style={{ padding: "5.5rem 1.25rem", position: "relative", zIndex: 1 }}>
        <div className="page-container">
          <p className="section-title" style={{ textAlign: "center", marginBottom: "0.75rem" }}>How it works</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, marginBottom: "3.5rem", letterSpacing: "-0.02em" }}>
            Two paths. One platform.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>

            {/* Path A */}
            <div className="card card-highlight" style={{ padding: "2.25rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(246,70,104,0.12)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", color: "var(--ember-coral)" }}>
                <IconSearch />
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Looking to join?</h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Browse verified teams, see who&apos;s already on them, and check their skill gaps. Request to join — your profile is only shared with that team, not the whole platform.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Browse teams", "Filter by skill", "Private application"].map((t) => (
                  <span key={t} className="skill-chip">{t}</span>
                ))}
              </div>
            </div>

            {/* Path B */}
            <div className="card card-brand" style={{ padding: "2.25rem" }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "rgba(152,64,99,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", color: "var(--ember-peach)" }}>
                <IconZap />
              </div>
              <h3 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Building a team?</h3>
              <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                Create your team, define the skills you need, and become the leader. Invite people or let them find you — your whole team votes on applicants, you make the call.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Team leader", "Skill matching", "Consensus voting"].map((t) => (
                  <span key={t} className="skill-chip">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why TeamUp ── */}
      <section style={{ background: "var(--color-bg-surface)", padding: "5.5rem 1.25rem", borderTop: "1px solid var(--color-border)", position: "relative", zIndex: 1 }}>
        <div className="page-container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {[
              { icon: <IconShield />, title: "Verified only", desc: "Every member uploads their college ID. No random internet strangers — only SIH participants." },
              { icon: <IconEyeOff />, title: "Semi-anonymous", desc: "You're visible to teams you apply to, not the whole platform. Your applications stay private from each other." },
              { icon: <IconLayers />, title: "Structured matching", desc: "Filter teams by domain, skills, experience level. Find the right fit, not just the first available slot." },
            ].map((item) => (
              <div key={item.title} className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "rgba(246,70,104,0.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ember-peach)" }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{item.title}</h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Transparency model ── */}
      <section style={{ padding: "5.5rem 1.25rem", position: "relative", zIndex: 1 }}>
        <div className="page-container" style={{ maxWidth: 760 }}>
          <p className="section-title" style={{ textAlign: "center", marginBottom: "0.75rem" }}>Transparency model</p>
          <h2 style={{ textAlign: "center", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            Semi-anonymous by design
          </h2>
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "3rem" }}>
            You can verify a team&apos;s credibility before applying. They can&apos;t see who else you&apos;re applying to.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {transparencyItems.map((row) => (
              <div key={row.label} className="card" style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.1rem 1.4rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${row.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: row.color, flexShrink: 0, marginTop: 2 }}>
                  {row.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.15rem" }}>{row.label}</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{row.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "5.5rem 1.25rem", textAlign: "center", background: "var(--color-bg-surface)", borderTop: "1px solid var(--color-border)", position: "relative", zIndex: 1, overflow: "hidden" }}>
        {/* Glow behind CTA */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(246,70,104,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 900, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
            Ready? Your team is waiting.
          </h2>
          <p style={{ color: "var(--color-text-secondary)", marginBottom: "2.5rem", fontSize: "1.05rem", maxWidth: 480, margin: "0 auto 2.5rem" }}>
            Sign up in 60 seconds. Verified. No spam. No public profiles until you choose.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg" id="cta-final" style={{ gap: "0.6rem" }}>
            Create your account
            <IconArrowRight />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--color-border)", padding: "2rem 1.25rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8rem", position: "relative", zIndex: 1 }}>
        <div className="page-container">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>TeamUp</span>
          </div>
          <p>Built for SIH 2026 · Semi-anonymous team matching · All verified</p>
        </div>
      </footer>
    </main>
  );
}
