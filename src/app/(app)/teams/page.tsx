"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TeamCard from "@/components/TeamCard";
import EmptyState from "@/components/EmptyState";
import { SIH_THEMES } from "@/lib/constants";

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

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
          <p className="section-title" style={{ marginBottom: "0.4rem" }}>Teams</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Explore <span className="gradient-text">Teams</span></h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "0.3rem", fontSize: "0.9rem" }}>
            {teams.length} team{teams.length !== 1 ? "s" : ""} matching your criteria
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--ember-peach)", marginBottom: "0.1rem", fontSize: "0.8rem", fontWeight: 600, width: "100%" }}>
          <IconFilter /> Filters
        </div>
        <div style={{ flex: "1 1 140px" }}>
          <label className="input-label">Status</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: "0.45rem 2rem 0.45rem 0.75rem" }}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="full">Full</option>
          </select>
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <label className="input-label">Domain</label>
          <select className="input-field" value={domain} onChange={(e) => setDomain(e.target.value)} style={{ padding: "0.45rem 2rem 0.45rem 0.75rem" }}>
            <option value="">All Domains</option>
            {SIH_THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ flex: "1 1 180px" }}>
          <label className="input-label">Skills Needed</label>
          <input className="input-field" placeholder="React, Node (comma sep)" value={skillsNeeded} onChange={(e) => setSkillsNeeded(e.target.value)} style={{ padding: "0.45rem 0.75rem" }} />
        </div>

        <div style={{ flex: "0 0 100px" }}>
          <label className="input-label">Min Exp</label>
          <input type="number" min="0" className="input-field" placeholder="0" value={minExperience} onChange={(e) => setMinExperience(e.target.value)} style={{ padding: "0.45rem 0.75rem" }} />
        </div>

        <div style={{ flex: "1 1 auto", display: "flex", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--color-text-secondary)", userSelect: "none" }}>
            <input type="checkbox" checked={genderNeed} onChange={(e) => setGenderNeed(e.target.checked)} style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--ember-coral)" }} />
            Needs female member
          </label>
        </div>
      </div>

      {/* ── Team Grid ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map((n) => <div key={n} className="card skeleton" style={{ height: 320 }} />)}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<IconSearch />}
          title="No teams found"
          description="Try adjusting your filters or create your own team."
          ctaText="Create Team"
          ctaHref="/teams/create"
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {teams.map((team) => <TeamCard key={team.id} team={team} />)}
        </div>
      )}
    </div>
  );
}
