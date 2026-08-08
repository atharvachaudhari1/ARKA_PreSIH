"use client";

import Link from "next/link";
import { useState } from "react";
import { Target, Crown, UserCircle2, Zap, Flag, FileText } from "lucide-react";
import ReportModal from "./ReportModal";
import { isStrongMatch } from "@/lib/recommendation";

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

interface TeamMember {
  id: string;
  name: string;
  department: string | null;
  skills: { skill: string; proficiency: string }[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  phone_number?: string | null;
  whatsapp_number?: string | null;
  bio?: string | null;
}

interface TeamLeader {
  id: string;
  name: string;
  phone_number: string | null;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  resume_storage_path?: string | null;
  bio?: string | null;
  skills?: { skill: string }[];
}

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  domain_interest: string | null;
  status: "open" | "full" | "dissolved";
  needed_female_count: number;
  skills_needed: string[];
  event?: { team_size_max?: number; min_female_required?: number };
  leader: TeamLeader;
  memberships: { user: TeamMember }[];
  slots?: { id: string; role_title: string; gender: string; skills: string[]; is_filled: boolean }[];
  join_requests?: { requester: TeamMember }[];
}

export default function TeamCard({ team, hideCTA = false, currentUserSkills = [] }: { team: TeamData, hideCTA?: boolean, currentUserSkills?: string[] }) {
  const [showReport, setShowReport] = useState(false);
  const squadMax = team.event?.team_size_max ?? 6;
  const activeMembersCount = team.memberships.length;
  const invitedMembersCount = team.join_requests?.length || 0;
  const totalSquadSize = activeMembersCount + invitedMembersCount;
  const vacancy = squadMax - totalSquadSize;
  const isFull = team.status === "full" || vacancy <= 0;

  const unfilledSlotSkills = team.slots 
    ? team.slots.filter(s => !s.is_filled).flatMap(s => s.skills)
    : [];
  const strongMatch = isStrongMatch(unfilledSlotSkills, currentUserSkills);

  const squadMembers = [
    ...team.memberships.filter(m => m.user.id !== team.leader.id).map(m => ({ ...m.user, isInvited: false })),
    ...(team.join_requests || []).map(jr => ({ ...jr.requester, isInvited: true }))
  ];

  return (
    <>
    <div 
      style={{ 
        background: "#ffffff",
        border: "2px solid #1a1a1a",
        boxShadow: "4px 4px 0px #1a1a1a",
        borderRadius: "6px",
        padding: "1.1rem", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        gap: "0.85rem",
        transition: "all 0.15s ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* ── Top Section & Badges ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", gap: "0.5rem" }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.5px", margin: 0, lineHeight: 1.3 }}>
            {team.name}
          </h2>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "flex-end", flexShrink: 0, alignItems: "center" }}>
            <button 
              onClick={() => setShowReport(true)}
              title="Report Team"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" }}
              onMouseOver={e => e.currentTarget.style.color = "#dc2626"}
              onMouseOut={e => e.currentTarget.style.color = "#9ca3af"}
            >
              <Flag size={16} strokeWidth={1.75} />
            </button>
            
            {strongMatch && (
              <span
                style={{
                  fontSize: "0.7rem", 
                  fontWeight: 800, 
                  fontFamily: "var(--font-mono)",
                  padding: "3px 8px", 
                  borderRadius: "3px",
                  background: "#fffbeb",
                  color: "#d97706", 
                  border: "1.5px solid #d97706",
                  boxShadow: "1.5px 1.5px 0px #1a1a1a",
                  letterSpacing: "0.5px"
                }}
              >
                🔥 STRONG MATCH
              </span>
            )}
            
            <span
              style={{
                fontSize: "0.7rem", 
                fontWeight: 800, 
                fontFamily: "var(--font-mono)",
                padding: "3px 8px", 
                borderRadius: "3px",
                background: isFull ? "#fef2f2" : "#ecfdf5",
                color: isFull ? "#dc2626" : "#059669", 
                border: `1.5px solid ${isFull ? "#dc2626" : "#059669"}`,
                boxShadow: "1.5px 1.5px 0px #1a1a1a",
                letterSpacing: "0.5px"
              }}
            >
              {isFull ? "CLOSED" : "OPEN"}
            </span>
            {!isFull && (
              <span
                style={{
                  fontSize: "0.7rem", 
                  fontWeight: 800, 
                  fontFamily: "var(--font-mono)",
                  padding: "3px 8px", 
                  borderRadius: "3px",
                  background: "#f8f6f0", 
                  color: "#1a1a1a", 
                  border: "1.5px solid #1a1a1a",
                  boxShadow: "1.5px 1.5px 0px #1a1a1a",
                }}
              >
              {vacancy} SPOT{vacancy !== 1 ? "S" : ""} LEFT
              </span>
            )}
          </div>
        </div>

        {/* Domain tag */}
        <div style={{ 
          display: "inline-flex", 
          alignItems: "center",
          gap: "4px",
          background: "#eef0ff", 
          color: "#1a1a1a", 
          border: "1.5px solid #5b5fc7", 
          padding: "2px 8px", 
          borderRadius: "3px", 
          fontSize: "0.75rem", 
          fontFamily: "var(--font-mono)", 
          fontWeight: 700,
          marginBottom: "0.5rem" 
        }}>
          <Target size={16} strokeWidth={1.75} color="#ef4444" fill="#fecaca" /> {team.domain_interest ?? "General Track / Unspecified Domain"}
        </div>

        {team.needed_female_count > 0 && (
          <div style={{ marginBottom: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.75rem", 
                fontWeight: 800, 
                padding: "3px 10px", 
                borderRadius: "4px",
                background: "#fdf4ff", 
                color: "#9333ea", 
                border: "1.5px solid #9333ea",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                boxShadow: "1.5px 1.5px 0px #1a1a1a",
                fontFamily: "var(--font-mono)"
              }}
            >
              <Crown size={16} strokeWidth={1.75} color="#d97706" fill="#fef08a" /> Seeking {team.needed_female_count} Female Member{team.needed_female_count !== 1 ? "s" : ""} (SIH Requirement)
            </span>
          </div>
        )}

        {team.description && (
          <p style={{ color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.5, margin: "0.35rem 0 0", fontWeight: 500 }}>
            {team.description}
          </p>
        )}
      </div>

      {/* ── Leader Box ── */}
      <div style={{ 
        background: "#fdfbf7", 
        border: "2px solid #1a1a1a", 
        borderRadius: "4px", 
        padding: "0.7rem", 
        boxShadow: "2px 2px 0px #1a1a1a" 
      }}>
        <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.35rem" }}>
          [TEAM LEADER DOSSIER]
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ fontWeight: 800, color: "#1a1a1a", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <UserCircle2 size={18} strokeWidth={1.75} color="#2563eb" fill="#bfdbfe" /> {team.leader.name}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {team.leader.phone_number && (
              <a href={`tel:${team.leader.phone_number}`} style={{ color: "#1a1a1a", textDecoration: "none", borderBottom: "1.5px solid #1a1a1a", paddingBottom: "1px" }}>📞 Call</a>
            )}
            {team.leader.whatsapp_number && (
              <a href={`https://wa.me/${team.leader.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "#059669", textDecoration: "none", borderBottom: "1.5px solid #059669", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><WhatsAppIcon size={12} /> WhatsApp</a>
            )}
            {team.leader.linkedin_url && (
              <a href={team.leader.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", borderBottom: "1.5px solid #2563eb", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><LinkedInIcon size={12} /> LinkedIn</a>
            )}
            {team.leader.github_url && (
              <a href={team.leader.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1a1a1a", textDecoration: "none", borderBottom: "1.5px solid #1a1a1a", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><GitHubIcon size={12} /> GitHub</a>
            )}
            {team.leader.portfolio_url && (
              <a href={team.leader.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: "#d97706", textDecoration: "none", borderBottom: "1.5px solid #d97706", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}>🌐 Portfolio</a>
            )}
            {team.leader.resume_storage_path && (
              <a href={`/api/users/resume?path=${encodeURIComponent(team.leader.resume_storage_path)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#dc2626", textDecoration: "none", borderBottom: "1.5px solid #dc2626", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><FileText size={12} /> Resume</a>
            )}
          </div>
        </div>
        {(team.leader.bio || (team.leader.skills && team.leader.skills.length > 0)) && (
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "#ffffff", border: "1.5px solid #eae6df", borderRadius: "4px" }}>
            {team.leader.bio && (
              <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "#4a4a4a", fontWeight: 500, fontStyle: "italic" }}>
                "{team.leader.bio}"
              </p>
            )}
            {team.leader.skills && team.leader.skills.length > 0 && (
              <div style={{ color: "#5b5fc7", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {team.leader.skills.map((s: any) => s.skill).join(", ")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Open Member Slots ── */}
      {team.slots && team.slots.filter(s => !s.is_filled).length > 0 && (
        <div>
          <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.35rem" }}>
            [OPEN MEMBER SLOTS]
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {team.slots.filter(s => !s.is_filled).map((slot) => (
              <div
                key={slot.id}
                style={{
                  background: "#ffffff", 
                  border: "1.5px solid #1a1a1a",
                  boxShadow: "1.5px 1.5px 0px #1a1a1a",
                  borderRadius: "3px", 
                  padding: "6px 10px", 
                  fontSize: "0.8rem", 
                  color: "#1a1a1a",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}><Zap size={16} strokeWidth={1.75} color="#ea580c" fill="#fef08a" /> {slot.role_title}</div>
                <div style={{ fontSize: "0.7rem", color: "#666", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  Req: {slot.gender.toUpperCase()} {slot.skills.length > 0 && `| ${slot.skills.join(", ")}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Members Preview ── */}
      <div>
        <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.35rem" }}>
          [CURRENT SQUAD ({totalSquadSize}/{squadMax})]
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {squadMembers.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic", padding: "0.25rem 0" }}>
              No other members yet.
            </div>
          )}
          {squadMembers.map((m) => (
            <div key={m.id} style={{ 
              background: m.isInvited ? "#fffbeb" : "#fafafa", 
              border: m.isInvited ? "1.5px dashed #f59e0b" : "1.5px solid #d1d5db", 
              borderRadius: "4px", 
              padding: "0.55rem", 
              boxShadow: m.isInvited ? "none" : "2px 2px 0px #d1d5db",
              opacity: m.isInvited ? 0.9 : 1
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ fontWeight: 800, color: "#4b5563", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <UserCircle2 size={16} strokeWidth={1.75} color="#4b5563" /> {m.name}
                  {m.isInvited && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 5px", background: "#fef3c7", color: "#b45309", border: "1px solid #b45309", borderRadius: "2px", marginLeft: "4px", fontWeight: 800 }}>INVITED</span>
                  )}
                  <span style={{ color: "#6b7280", marginLeft: "0.25rem", fontWeight: 600, fontSize: "0.75rem" }}>
                    ({m.department || "Dept N/A"})
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  {m.phone_number && (
                    <a href={`tel:${m.phone_number}`} style={{ color: "#4b5563", textDecoration: "none", borderBottom: "1.5px solid #4b5563", paddingBottom: "1px" }}>📞 Call</a>
                  )}
                  {m.whatsapp_number && (
                    <a href={`https://wa.me/${m.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "#059669", textDecoration: "none", borderBottom: "1.5px solid #059669", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><WhatsAppIcon size={11} /> WA</a>
                  )}
                  {m.linkedin_url && (
                    <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", borderBottom: "1.5px solid #2563eb", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><LinkedInIcon size={11} /> LinkedIn</a>
                  )}
                  {m.github_url && (
                    <a href={m.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#4b5563", textDecoration: "none", borderBottom: "1.5px solid #4b5563", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><GitHubIcon size={11} /> GitHub</a>
                  )}
                  {m.portfolio_url && (
                    <a href={m.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: "#d97706", textDecoration: "none", borderBottom: "1.5px solid #d97706", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}>🌐 Portfolio</a>
                  )}
                  {(m as any).resume_storage_path && (
                    <a href={`/api/users/resume?path=${encodeURIComponent((m as any).resume_storage_path)}`} target="_blank" rel="noopener noreferrer" style={{ color: "#dc2626", textDecoration: "none", borderBottom: "1.5px solid #dc2626", paddingBottom: "1px", display: "inline-flex", alignItems: "center", gap: "4px" }}><FileText size={11} /> Resume</a>
                  )}
                </div>
              </div>
              {(m.bio || (m.skills && m.skills.length > 0)) && (
                <div style={{ marginTop: "0.4rem", padding: "0.4rem", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "3px" }}>
                  {m.bio && (
                    <p style={{ margin: "0 0 0.3rem", fontSize: "0.78rem", color: "#6b7280", fontWeight: 500, fontStyle: "italic" }}>
                      "{m.bio}"
                    </p>
                  )}
                  {m.skills && m.skills.length > 0 && (
                    <div style={{ color: "#6b7280", fontSize: "0.7rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                      {m.skills.map((s: any) => s.skill).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Action CTA ── */}
      {!hideCTA && (
        <div style={{ marginTop: "0.25rem" }}>
          {isFull ? (
            <button 
              disabled 
              style={{ 
                width: "100%", 
                padding: "0.6rem",
                background: "#e5e7eb", 
                color: "#6b7280", 
                border: "2px solid #9ca3af", 
                borderRadius: "4px",
                fontWeight: 800, 
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: "not-allowed",
                boxShadow: "none"
              }}
            >
              ⚠️ TEAM CAPACITY REACHED (FULL)
            </button>
          ) : (
            <Link 
              href={`/teams/${team.id}`} 
              style={{ 
                display: "block", 
                textAlign: "center", 
                textDecoration: "none",
                width: "100%",
                padding: "0.7rem",
                background: "#5b5fc7",
                color: "#ffffff",
                border: "2px solid #1a1a1a",
                borderRadius: "4px",
                boxShadow: "4px 4px 0px #1a1a1a",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxSizing: "border-box"
              }}
            >
              View Dossier & Request to Join →
            </Link>
          )}
        </div>
      )}
    </div>
    
    {showReport && (
      <ReportModal
        targetId={team.id}
        targetType="team"
        targetName={team.name}
        onClose={() => setShowReport(false)}
      />
    )}
    </>
  );
}
