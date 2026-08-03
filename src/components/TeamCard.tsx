import Link from "next/link";
import { ContactVisibility } from "@prisma/client";

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

export default function TeamCard({ team, hideCTA = false }: { team: TeamData, hideCTA?: boolean }) {
  const vacancy = 6 - team.memberships.length;
  const isFull = team.status === "full" || vacancy <= 0;

  return (
    <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* ── Header ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{team.name}</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span
              style={{
                fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-sm)",
                background: isFull ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
                color: isFull ? "#ef4444" : "#10b981", border: `1px solid ${isFull ? "#ef444440" : "#10b98140"}`,
              }}
            >
              {isFull ? "FULL" : "OPEN"}
            </span>
            {!isFull && (
              <span
                style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-sm)",
                  background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)",
                }}
              >
                {vacancy} spot{vacancy !== 1 ? "s" : ""} left
              </span>
            )}
            {team.needed_female_count > 0 && (
              <span
                style={{
                  fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px", borderRadius: "var(--radius-sm)",
                  background: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid #c084fc40",
                }}
              >
                Needs {team.needed_female_count} female member{team.needed_female_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <p style={{ color: "var(--color-brand-light)", fontSize: "0.85rem", fontWeight: 500 }}>
          {team.domain_interest ?? "No domain specified"}
        </p>
      </div>

      {team.description && (
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
          {team.description}
        </p>
      )}

      {/* ── Leader ── */}
      <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
          Team Leader
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 600 }}>{team.leader.name}</div>
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
            {team.leader.phone_number && (
              <a href={`tel:${team.leader.phone_number}`} style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>📞 Call</a>
            )}
            {team.leader.whatsapp_number && (
              <a href={`https://wa.me/${team.leader.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", textDecoration: "none" }}>💬 WhatsApp</a>
            )}
            {team.leader.linkedin_url && (
              <a href={team.leader.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>in LinkedIn</a>
            )}
          </div>
        </div>
      </div>

      {/* ── Skills Needed ── */}
      {team.skills_needed.length > 0 && (
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
            Looking For
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {team.skills_needed.map((skill) => (
              <span
                key={skill}
                style={{
                  background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
                  borderRadius: "4px", padding: "2px 8px", fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                  color: "var(--color-text-primary)"
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Members Preview ── */}
      <div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
          Existing Members ({team.memberships.length}/6)
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {team.memberships.map((m) => (
            <div key={m.user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1px solid var(--color-border-hover)", paddingBottom: "0.5rem" }}>
              <div>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{m.user.name}</span>
                <span style={{ color: "var(--color-text-muted)", marginLeft: "0.5rem" }}>
                  {m.user.department}
                  {m.user.verification_status !== "verified" && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 4px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", borderRadius: "2px", marginLeft: "4px" }}>Unverified</span>
                  )}
                </span>
              </div>
              <div style={{ color: "var(--color-brand-light)", fontSize: "0.75rem" }}>
                {m.user.skills.slice(0, 2).map((s) => s.skill).join(", ")}
                {m.user.skills.length > 2 && " +"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      {!hideCTA && (
        <div style={{ marginTop: "0.5rem" }}>
          {isFull ? (
            <button disabled className="btn btn-secondary" style={{ width: "100%", opacity: 0.5, cursor: "not-allowed" }}>
              Team Full
            </button>
          ) : (
            <Link href={`/teams/${team.id}`} className="btn btn-primary" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              View Details & Request to Join
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
