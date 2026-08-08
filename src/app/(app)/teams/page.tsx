"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import TeamCard from "@/components/TeamCard";
import { SIH_THEMES } from "@/lib/constants";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  // Filters
  const [status, setStatus] = useState<string>("open");
  const [domain, setDomain] = useState<string>("");
  const [genderNeed, setGenderNeed] = useState<boolean>(false);
  const [skillsNeeded, setSkillsNeeded] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Debounced copy of the search term so the API is hit only after the user
  // pauses typing, not on every keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (domain) params.set("domain", domain);
  if (genderNeed) params.set("gender_need", "true");
  if (debouncedSearch) params.set("search", debouncedSearch);
  const skillsArray = skillsNeeded.split(",").map((s) => s.trim()).filter(Boolean);
  skillsArray.forEach((s) => params.append("skills_needed[]", s));

  const { data, isLoading: loading } = useSWR(`/api/teams?${params.toString()}`, fetcher, { keepPreviousData: true });
  const teams = data?.teams || [];

  const { data: profileData } = useSWR("/api/users/profile", fetcher);
  const userSkills = profileData?.profile?.skills?.map((s: any) => s.skill.toLowerCase()) || [];

  const resetFilters = () => {
    setStatus("open");
    setDomain("");
    setGenderNeed(false);
    setSkillsNeeded("");
  };

  // Shared hover handler for inputs/selects
  const fieldHoverOn = (e: React.SyntheticEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    if (document.activeElement !== el) {
      el.style.borderColor = "#5b5fc7";
      el.style.boxShadow = "3px 3px 0px #5b5fc7";
    }
  };
  const fieldHoverOff = (e: React.SyntheticEvent<HTMLElement>, shadow = "2px 2px 0px rgba(0,0,0,0.1)") => {
    const el = e.currentTarget as HTMLElement;
    if (document.activeElement !== el) {
      el.style.borderColor = "#1a1a1a";
      el.style.boxShadow = shadow;
    }
  };
  const fieldFocusOn = (e: React.SyntheticEvent<HTMLElement>) => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = "#5b5fc7";
    el.style.boxShadow = "3px 3px 0px #5b5fc7";
  };
  const fieldFocusOff = (e: React.SyntheticEvent<HTMLElement>, shadow = "2px 2px 0px rgba(0,0,0,0.1)") => {
    const el = e.currentTarget as HTMLElement;
    el.style.borderColor = "#1a1a1a";
    el.style.boxShadow = shadow;
  };

  const fieldBaseStyle: React.CSSProperties = {
    padding: "0.65rem 0.85rem",
    border: "2px solid #1a1a1a",
    borderRadius: "4px",
    background: "#fdfbfa",
    color: "#1a1a1a",
    fontWeight: 700,
    fontSize: "0.95rem",
    width: "100%",
    outline: "none",
    minHeight: "44px",
    boxSizing: "border-box",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 2rem", minHeight: "85vh", boxSizing: "border-box" }} className="page-container">
      {/* ── Hero Title Section ── */}
      <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1.5rem" }}>
        <div>
          <div style={{
            display: "inline-block",
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "0.35rem 0.85rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            borderRadius: "3px",
            marginBottom: "0.75rem",
            letterSpacing: "1px",
            boxShadow: "2px 2px 0px #5b5fc7"
          }}>
            $ LS ./TEAMS --VIEW=ALL
          </div>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.04em", lineHeight: "1.15", margin: 0 }}>
            Explore Teams
          </h1>
          <p style={{ color: "#5a5a5a", marginTop: "0.4rem", fontSize: "1.05rem", fontWeight: 500 }}>
            {loading ? "Scanning sectors for open vacancies..." : `${teams.length} team${teams.length !== 1 ? "s" : ""} actively broadcasting matching your filter parameters.`}
          </p>
        </div>
        <div style={{ width: "auto" }}>
          <Link
            href="/teams/create"
            className="btn-mobile-full"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "#5b5fc7",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px #1a1a1a",
              padding: "0.85rem 1.5rem",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.95rem",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "6px 6px 0px #1a1a1a"; e.currentTarget.style.background = "#4a4fb5"; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "4px 4px 0px #1a1a1a"; e.currentTarget.style.background = "#5b5fc7"; }}
          >
            <span>+</span> Deploy New Team
          </Link>
        </div>
      </div>

      {/* ── Terminal Control Pipeline (Filter Bar) ── */}
      <div style={{
        background: "#ffffff",
        border: "2px solid #1a1a1a",
        boxShadow: "5px 5px 0px #1a1a1a",
        borderRadius: "6px",
        marginBottom: "2.5rem",
        overflow: "hidden"
      }}>
        {/* Console Header Bar */}
        <div style={{
          background: "#1a1a1a",
          color: "#ffffff",
          padding: "0.65rem 1.25rem",
          fontSize: "0.75rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 800,
          letterSpacing: "1px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #1a1a1a"
        }}>
          <span>[SYSTEM // FILTER PIPELINE]</span>
          <span style={{ opacity: 0.8 }} className="desktop-only">STATUS: ACTIVE</span>
        </div>

        {/* Filter Inputs */}
        <div className="responsive-stack" style={{ padding: "1.25rem 1.25rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>

          {/* Vacancy Status */}
          <div style={{ flex: "1 1 auto", minWidth: "160px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "block", letterSpacing: "0.5px" }}>
              VACANCY STATUS
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ ...fieldBaseStyle, boxShadow: "2px 2px 0px rgba(0,0,0,0.1)", cursor: "pointer" }}
              onFocus={fieldFocusOn}
              onBlur={fieldFocusOff}
              onMouseOver={fieldHoverOn}
              onMouseOut={fieldHoverOff}
            >
              <option value="">All Teams (Open &amp; Full)</option>
              <option value="open">🟢 Open (Has Vacancy)</option>
              <option value="full">🔴 Full (Completed)</option>
            </select>
          </div>

          {/* Hackathon Domain */}
          <div style={{ flex: "1 1 auto", minWidth: "180px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "block", letterSpacing: "0.5px" }}>
              HACKATHON DOMAIN
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              style={{ ...fieldBaseStyle, boxShadow: "2px 2px 0px rgba(0,0,0,0.1)", cursor: "pointer" }}
              onFocus={fieldFocusOn}
              onBlur={fieldFocusOff}
              onMouseOver={fieldHoverOn}
              onMouseOut={fieldHoverOff}
            >
              <option value="">🌐 All Domains &amp; Themes</option>
              {SIH_THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Required Skillsets */}
          <div style={{ flex: "2 1 auto", minWidth: "200px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "block", letterSpacing: "0.5px" }}>
              REQUIRED SKILLSETS
            </label>
            <input
              placeholder="e.g. React, Node (comma separated)"
              value={skillsNeeded}
              onChange={(e) => setSkillsNeeded(e.target.value)}
              style={{ ...fieldBaseStyle, fontWeight: 600, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.06)" }}
              onFocus={fieldFocusOn}
              onBlur={(e) => fieldFocusOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
              onMouseOver={fieldHoverOn}
              onMouseOut={(e) => fieldHoverOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
            />
          </div>

          {/* Search by Name */}
          <div style={{ flex: "2 1 auto", minWidth: "200px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "block", letterSpacing: "0.5px" }}>
              SEARCH TEAMS OR MEMBERS
            </label>
            <input
              placeholder="Search by team, leader, or member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...fieldBaseStyle, fontWeight: 600, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.06)" }}
              onFocus={fieldFocusOn}
              onBlur={(e) => fieldFocusOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
              onMouseOver={fieldHoverOn}
              onMouseOut={(e) => fieldHoverOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
            />
          </div>

          {/* Gender Quota Toggle */}
          <div style={{ flex: "1 1 auto", minWidth: "220px", display: "flex", alignItems: "flex-end" }}>
            <label
              onClick={() => setGenderNeed(!genderNeed)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.65rem 1.15rem",
                border: genderNeed ? "2px solid #5b5fc7" : "2px solid #1a1a1a",
                borderRadius: "4px",
                background: genderNeed ? "#eef0ff" : "#ffffff",
                boxShadow: genderNeed ? "3px 3px 0px #5b5fc7" : "2px 2px 0px #1a1a1a",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 800,
                color: genderNeed ? "#5b5fc7" : "#1a1a1a",
                userSelect: "none",
                transition: "all 0.15s ease",
                width: "100%",
                justifyContent: "center",
                minHeight: "44px",
                boxSizing: "border-box"
              }}
              onMouseOver={(e) => {
                if (!genderNeed) {
                  e.currentTarget.style.borderColor = "#5b5fc7";
                  e.currentTarget.style.boxShadow = "3px 3px 0px #5b5fc7";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (!genderNeed) {
                  e.currentTarget.style.borderColor = "#1a1a1a";
                  e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              <input
                type="checkbox"
                checked={genderNeed}
                onChange={() => {}}
                style={{ cursor: "pointer", width: 18, height: 18, accentColor: "#5b5fc7" }}
              />
              Needs Female Member (SIH Quota)
            </label>
          </div>

        </div>
      </div>

      {/* ── Team Grid or Empty State ── */}
      {loading ? (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: 300,
                background: "#f5f3ec",
                border: "2px dashed #1a1a1a",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "#888",
                fontSize: "0.9rem"
              }}
            >
              [LOADING SECTOR DATA...]
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div style={{
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          boxShadow: "6px 6px 0px #1a1a1a",
          borderRadius: "8px",
          padding: "3.5rem 1.5rem",
          textAlign: "center",
          maxWidth: "680px",
          margin: "2rem auto",
          boxSizing: "border-box"
        }}>
          <div style={{
            width: "64px",
            height: "64px",
            margin: "0 auto 1.25rem",
            background: "#eef0ff",
            border: "2px solid #1a1a1a",
            borderRadius: "8px",
            boxShadow: "3px 3px 0px #1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem"
          }}>
            🛰️
          </div>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.02em", marginBottom: "0.6rem", fontFamily: "var(--font-sans)" }}>
            No Active Team Broadcasts
          </h3>
          <p style={{ color: "#5a5a5a", fontSize: "1rem", maxWidth: "460px", margin: "0 auto 2rem", lineHeight: "1.6" }}>
            We scanned the repository but couldn&apos;t find any open squads matching your current filter parameters. Try broadening your criteria or inaugurate your own project squad!
          </p>
          <div className="responsive-stack" style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              onClick={resetFilters}
              className="btn-mobile-full"
              style={{
                border: "2px solid #1a1a1a",
                background: "#f8f6f0",
                color: "#1a1a1a",
                padding: "0.75rem 1.5rem",
                fontWeight: 800,
                fontSize: "0.9rem",
                fontFamily: "var(--font-mono)",
                borderRadius: "4px",
                boxShadow: "3px 3px 0px #1a1a1a",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "all 0.15s ease",
                minHeight: "44px"
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#5b5fc7"; e.currentTarget.style.boxShadow = "4px 4px 0px #5b5fc7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Reset All Filters
            </button>
            <Link
              href="/teams/create"
              className="btn-mobile-full"
              style={{
                border: "2px solid #1a1a1a",
                background: "#5b5fc7",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                fontWeight: 800,
                fontSize: "0.9rem",
                fontFamily: "var(--font-mono)",
                borderRadius: "4px",
                boxShadow: "3px 3px 0px #1a1a1a",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                minHeight: "44px"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#4a4fb5"; e.currentTarget.style.boxShadow = "4px 4px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#5b5fc7"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              + Launch Your Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
          {teams.map((team: any) => (
            <TeamCard key={team.id} team={team} currentUserSkills={userSkills} hideCollege />
          ))}
        </div>
      )}
    </div>
  );
}
