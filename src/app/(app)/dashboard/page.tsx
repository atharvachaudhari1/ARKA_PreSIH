"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TeamCard from "@/components/TeamCard";
import { SIH_THEMES } from "@/lib/constants";

export default function DashboardPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState<string>("open");
  const [domain, setDomain] = useState<string>("");
  const [genderNeed, setGenderNeed] = useState<boolean>(false);
  const [minExperience, setMinExperience] = useState<string>("");
  const [skillsNeeded, setSkillsNeeded] = useState<string>("");

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (domain) params.set("domain", domain);
    if (genderNeed) params.set("gender_need", "true");
    if (minExperience) params.set("min_experience", minExperience);
    
    // Split skills by comma
    const skillsArray = skillsNeeded.split(",").map((s) => s.trim()).filter(Boolean);
    skillsArray.forEach((s) => params.append("skills_needed[]", s));

    const res = await fetch(`/api/teams?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams);
    }
    setLoading(false);
  }, [status, domain, genderNeed, minExperience, skillsNeeded]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="section-title" style={{ marginBottom: "0.4rem" }}>$ ls ./teams</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Explore Teams</h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
            {teams.length} team{teams.length !== 1 ? "s" : ""} matching your criteria.
          </p>
        </div>
        <div>
          <Link href="/teams/create" className="btn btn-primary" style={{ textDecoration: "none" }}>
            + Create Team
          </Link>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 150px" }}>
          <label className="input-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Status</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.4rem 0.6rem", height: "auto" }}>
            <option value="">All</option>
            <option value="open">Open (Has vacancy)</option>
            <option value="full">Full</option>
          </select>
        </div>
        
        <div style={{ flex: "1 1 150px" }}>
          <label className="input-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Domain</label>
          <select className="input-field" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ padding: "0.4rem 0.6rem", height: "auto" }}>
            <option value="">All Domains</option>
            {SIH_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ flex: "1 1 180px" }}>
          <label className="input-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Skills Needed</label>
          <input className="input-field" placeholder="e.g. React, Node (comma sep)" value={skillsNeeded} onChange={(e) => setSkillsNeeded(e.target.value)} style={{ padding: "0.4rem 0.6rem", height: "auto" }} />
        </div>

        <div style={{ flex: "0 0 100px" }}>
          <label className="input-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>My Exp (count)</label>
          <input type="number" min="0" className="input-field" placeholder="0" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} style={{ padding: "0.4rem 0.6rem", height: "auto" }} />
        </div>

        <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text-secondary)", userSelect: "none" }}>
            <input type="checkbox" checked={genderNeed} onChange={(e) => setGenderNeed(e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16 }} />
            Needs female member
          </label>
        </div>
      </div>

      {/* ── Team Grid ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="card skeleton" style={{ height: 300 }} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 1rem", border: "1px dashed var(--color-border-hover)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>No teams found</h3>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Try adjusting your filters or create your own team.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
