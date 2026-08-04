import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  department: string | null;
  verification_status: "pending" | "verified" | "rejected";
  skills: { skill: string; proficiency: string }[];
}

interface TeamLeader {
  id: string;
  name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  linkedin_url: string | null;
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  domain_interest: string | null;
  status: "open" | "full";
  needed_female_count: number;
  skills_needed: string[];
  min_experience_required: number | null;
  leader: TeamLeader;
  memberships: { user: TeamMember }[];
}

// ── SVG icons ──────────────────────────────────────────────────────────────
function IconUsers() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8 8a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function IconWhatsApp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}
function IconLinkedIn() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function IconArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

export default function TeamCard({ team, hideCTA = false }: { team: TeamData; hideCTA?: boolean }) {
  const vacancy = 6 - team.memberships.length;
  const isFull  = team.status === "full" || vacancy <= 0;

  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* ── Header ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.2 }}>{team.name}</h2>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", flexShrink: 0 }}>
            <span style={{
              fontSize: "0.68rem", fontWeight: 800, padding: "2px 9px", borderRadius: "var(--radius-full)",
              background: isFull ? "rgba(246,70,104,0.12)" : "rgba(52,211,153,0.12)",
              color: isFull ? "var(--ember-coral)" : "#34d399",
              border: `1px solid ${isFull ? "rgba(246,70,104,0.25)" : "rgba(52,211,153,0.25)"}`,
              letterSpacing: "0.06em",
            }}>
              {isFull ? "FULL" : "OPEN"}
            </span>
            {!isFull && (
              <span style={{
                fontSize: "0.68rem", fontWeight: 600, padding: "2px 9px", borderRadius: "var(--radius-full)",
                background: vacancy <= 2 ? "rgba(254,150,119,0.12)" : "var(--color-bg-elevated)",
                color: vacancy <= 2 ? "var(--ember-peach)" : "var(--color-text-secondary)",
                border: `1px solid ${vacancy <= 2 ? "rgba(254,150,119,0.25)" : "var(--color-border)"}`,
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}>
                <IconUsers />
                {vacancy} left
              </span>
            )}
            {team.needed_female_count > 0 && (
              <span style={{
                fontSize: "0.68rem", fontWeight: 600, padding: "2px 9px", borderRadius: "var(--radius-full)",
                background: "rgba(152,64,99,0.15)", color: "var(--color-accent-light)",
                border: "1px solid rgba(152,64,99,0.3)",
              }}>
                ♀ ×{team.needed_female_count}
              </span>
            )}
          </div>
        </div>

        <p style={{ color: "var(--ember-peach)", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.02em" }}>
          {team.domain_interest ?? "No domain specified"}
        </p>
      </div>

      {team.description && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.55 }}>
          {team.description}
        </p>
      )}

      {/* ── Leader ── */}
      <div style={{
        background: "rgba(65,67,106,0.3)", border: "1px solid rgba(65,67,106,0.6)",
        borderRadius: "var(--radius-md)", padding: "0.9rem 1rem",
      }}>
        <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.5rem", fontWeight: 700 }}>
          Team Leader
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{team.leader.name}</div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {team.leader.phone_number && (
              <a href={`tel:${team.leader.phone_number}`} style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.8rem" }}>
                <IconPhone /> Call
              </a>
            )}
            {team.leader.whatsapp_number && (
              <a href={`https://wa.me/${team.leader.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#34d399", textDecoration: "none", fontSize: "0.8rem" }}>
                <IconWhatsApp /> WhatsApp
              </a>
            )}
            {team.leader.linkedin_url && (
              <a href={team.leader.linkedin_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--ember-peach)", textDecoration: "none", fontSize: "0.8rem" }}>
                <IconLinkedIn /> LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Skills Needed ── */}
      {team.skills_needed.length > 0 && (
        <div>
          <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.5rem", fontWeight: 700 }}>
            Looking For
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {team.skills_needed.map((skill) => (
              <span key={skill} className="skill-chip">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Members Preview ── */}
      <div>
        <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.5rem", fontWeight: 700 }}>
          Members ({team.memberships.length}/6)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {team.memberships.map((m) => (
            <div key={m.user.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: "0.83rem", paddingBottom: "0.45rem",
              borderBottom: "1px solid var(--color-border)",
            }}>
              <div>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{m.user.name}</span>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.45rem", fontSize: "0.78rem" }}>
                  {m.user.department}
                  {m.user.verification_status !== "verified" && (
                    <span className="badge badge-unverified" style={{ marginLeft: 6 }}>Unverified</span>
                  )}
                </span>
              </div>
              <div style={{ color: "var(--ember-peach)", fontSize: "0.73rem", fontFamily: "var(--font-mono)" }}>
                {m.user.skills.slice(0, 2).map((s) => s.skill).join(", ")}
                {m.user.skills.length > 2 && " +"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      {!hideCTA && (
        <div style={{ marginTop: "0.25rem" }}>
          {isFull ? (
            <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.4, cursor: "not-allowed" }}>
              Team Full
            </button>
          ) : (
            <Link href={`/teams/${team.id}`} className="btn btn-primary" style={{ display: "flex", textDecoration: "none", gap: "0.5rem" }}>
              View Details & Request to Join
              <IconArrow />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
