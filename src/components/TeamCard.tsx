"use client";

import Link from "next/link";
import { useState } from "react";
import { Target, Crown, UserCircle2, Zap, Flag } from "lucide-react";
import ReportModal from "./ReportModal";

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
  slots?: { id: string; role_title: string; gender: string; skills: string[]; is_filled: boolean }[];
}

export default function TeamCard({ team, hideCTA = false }: { team: TeamData, hideCTA?: boolean }) {
  const [showReport, setShowReport] = useState(false);
  const vacancy = 6 - team.memberships.length;
  const isFull = team.status === "full" || vacancy <= 0;

  return (
    <>
    <div 
      style={{ 
        background: "#ffffff",
        border: "2px solid #1a1a1a",
        boxShadow: "5px 5px 0px #1a1a1a",
        borderRadius: "6px",
        padding: "1.75rem", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        gap: "1.5rem",
        transition: "all 0.15s ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* ── Top Section & Badges ── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", gap: "0.5rem" }}>
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
          marginBottom: "0.75rem" 
        }}>
          <Target size={16} strokeWidth={1.75} /> {team.domain_interest ?? "General Track / Unspecified Domain"}
        </div>

        {team.needed_female_count > 0 && (
          <div style={{ marginBottom: "0.75rem" }}>
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
              <Crown size={16} strokeWidth={1.75} /> Seeking {team.needed_female_count} Female Member{team.needed_female_count !== 1 ? "s" : ""} (SIH Requirement)
            </span>
          </div>
        )}

        {team.description && (
          <p style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: 1.6, margin: "0.5rem 0 0", fontWeight: 500 }}>
            {team.description}
          </p>
        )}
      </div>

      {/* ── Leader Box ── */}
      <div style={{ 
        background: "#fdfbf7", 
        border: "2px solid #1a1a1a", 
        borderRadius: "4px", 
        padding: "1rem", 
        boxShadow: "2px 2px 0px #1a1a1a" 
      }}>
        <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
          [TEAM LEADER DOSSIER]
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ fontWeight: 800, color: "#1a1a1a", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "4px" }}>
            <UserCircle2 size={18} strokeWidth={1.75} /> {team.leader.name}
          </div>
          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {team.leader.phone_number && (
              <a href={`tel:${team.leader.phone_number}`} style={{ color: "#1a1a1a", textDecoration: "none", borderBottom: "1.5px solid #1a1a1a", paddingBottom: "1px" }}>📞 Call</a>
            )}
            {team.leader.whatsapp_number && (
              <a href={`https://wa.me/${team.leader.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "#059669", textDecoration: "none", borderBottom: "1.5px solid #059669", paddingBottom: "1px" }}>💬 WhatsApp</a>
            )}
            {team.leader.linkedin_url && (
              <a href={team.leader.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", borderBottom: "1.5px solid #2563eb", paddingBottom: "1px" }}>in LinkedIn</a>
            )}
          </div>
        </div>
      </div>

      {/* ── Open Member Slots ── */}
      {team.slots && team.slots.filter(s => !s.is_filled).length > 0 && (
        <div>
          <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
            [OPEN MEMBER SLOTS]
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
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
                  gap: "0.25rem"
                }}
              >
                <div style={{ fontWeight: 800, display: "flex", alignItems: "center", gap: "4px" }}><Zap size={16} strokeWidth={1.75} /> {slot.role_title}</div>
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
        <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
          [CURRENT SQUAD ({team.memberships.length}/6)]
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {team.memberships.map((m) => (
            <div key={m.user.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", borderBottom: "1.5px solid #eae6df", paddingBottom: "0.4rem" }}>
              <div>
                <span style={{ fontWeight: 700, color: "#1a1a1a" }}>• {m.user.name}</span>
                <span style={{ color: "#6b7280", marginLeft: "0.5rem", fontWeight: 500, fontSize: "0.8rem" }}>
                  ({m.user.department || "Dept N/A"})
                  {m.user.verification_status !== "verified" && (
                    <span style={{ fontSize: "0.65rem", padding: "1px 5px", background: "#fffbeb", color: "#d97706", border: "1px solid #d97706", borderRadius: "2px", marginLeft: "6px", fontWeight: 800 }}>Unverified</span>
                  )}
                </span>
              </div>
              <div style={{ color: "#5b5fc7", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {m.user.skills.slice(0, 2).map((s) => s.skill).join(", ")}
                {m.user.skills.length > 2 && " +"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Action CTA ── */}
      {!hideCTA && (
        <div style={{ marginTop: "0.5rem" }}>
          {isFull ? (
            <button 
              disabled 
              style={{ 
                width: "100%", 
                padding: "0.75rem",
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
                padding: "0.85rem",
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
