"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  Zap, Building2, User, Trophy, Search, SearchX, GraduationCap,
  ChevronLeft, ChevronRight, CircleCheck, Send, Presentation, Users,
} from "lucide-react";

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PAGE_SIZE = 9;

export default function HackersPage() {
  const [skill, setSkill] = useState("");
  const [department, setDepartment] = useState("");
  const [gender, setGender] = useState("");
  const [minHackathons, setMinHackathons] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(PAGE_SIZE));
  if (skill) params.set("skill", skill);
  if (department) params.set("department", department);
  if (gender) params.set("gender", gender);
  if (minHackathons) params.set("min_hackathons", minHackathons);
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data: hackersData, isLoading: loading } = useSWR(`/api/hackers?${params.toString()}`, fetcher, { keepPreviousData: true });
  const { data: profileData } = useSWR('/api/users/profile', fetcher);
  const { data: requestsData } = useSWR('/api/join-requests', fetcher);
  // Live platform stats — refreshed every 60s so "online now" stays current.
  const { data: statsData } = useSWR("/api/stats", fetcher, { refreshInterval: 60000, revalidateOnFocus: false });

  const ledTeamId = profileData?.profile?.led_teams?.[0]?.id || null;
  const hackers = hackersData?.hackers || [];
  const total = hackersData?.total || 0;
  const totalPages = hackersData?.totalPages || 1;
  const facets = hackersData?.facets || { departments: [], genders: [], skills: [] };

  // Users who already have a pending invite from my team — button disabled for them
  const invitedUserIds = new Set(
    (requestsData?.outboundInvites || [])
      .filter((r: any) => r.status === 'pending' && r.direction === 'team_to_user')
      .map((r: any) => r.requester.id)
  );

  // Reset to page 1 whenever a filter changes
  const setSkillFilter = (v: string) => { setSkill(v); setPage(1); };
  const setDepartmentFilter = (v: string) => { setDepartment(v); setPage(1); };
  const setGenderFilter = (v: string) => { setGender(v); setPage(1); };
  const setMinHackathonsFilter = (v: string) => { setMinHackathons(v); setPage(1); };
  const setSearchFilter = (v: string) => { setSearchQuery(v); setPage(1); };

  async function handleInvite(hackerId: string) {
    if (!ledTeamId) return;
    setInvitingId(hackerId);
    
    try {
      const res = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: ledTeamId, user_id: hackerId, direction: 'team_to_user' })
      });
      
      if (res.ok) {
        toast('Invite sent successfully!', 'success');
        mutate('/api/join-requests');
      } else {
        const errorData = await res.json();
        toast(`Error: ${errorData.error}`, 'error');
      }
    } catch {
      toast('An error occurred while sending the invite.', 'error');
    }
    setInvitingId(null);
  }

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

  const paginationButtonStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    background: "#1a1a1a",
    color: "#ffffff",
    border: "2px solid #1a1a1a",
    boxShadow: "2px 2px 0px #5b5fc7",
    borderRadius: "4px",
    fontWeight: 800,
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
    cursor: "pointer",
    minWidth: "44px",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 2rem", paddingBottom: "110px", minHeight: "85vh", boxSizing: "border-box" }} className="page-container">
      {/* ── Hero Title Section ── */}
      <div style={{ marginBottom: "2.5rem" }}>
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
          $ ./FIND_TALENT.SH --LIST
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "2.75rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.04em", lineHeight: "1.15", margin: 0 }}>
            Solo Hackers
          </h1>
          <div
            title="Users at the platform right now / active in the last 24h"
            style={{
              display: "flex",
              alignItems: "stretch",
              border: "2px solid #1a1a1a",
              boxShadow: "2px 2px 0px rgba(0,0,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
              fontFamily: "var(--font-mono)",
              background: "#fdfbf7",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.15rem", padding: "0.3rem 0.75rem", background: (statsData?.online_now ?? 0) > 0 ? "#ecfdf5" : "transparent" }}>
              <span style={{ fontSize: "0.58rem", letterSpacing: "1px", color: "#6b7280", fontWeight: 800 }}>ONLINE</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1a1a1a", lineHeight: 1, display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: (statsData?.online_now ?? 0) > 0 ? "#10b981" : "#9ca3af", border: "1.5px solid #1a1a1a" }} />
                {statsData?.online_now ?? "—"}
              </span>
            </div>
            <div style={{ width: 2, background: "#1a1a1a" }} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.15rem", padding: "0.3rem 0.75rem" }}>
              <span style={{ fontSize: "0.58rem", letterSpacing: "1px", color: "#6b7280", fontWeight: 800 }}>ACTIVE 24H</span>
              <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>
                {statsData?.active_24h ?? "—"}
              </span>
            </div>
          </div>
        </div>
        <p style={{ color: "#5a5a5a", fontSize: "1.05rem", fontWeight: 500, marginTop: "0.4rem" }}>
          {loading ? "Scanning registration database for unassigned hackers..." : `${total} solo hacker${total !== 1 ? "s" : ""} found matching your filter parameters.`}
        </p>
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
          <span>[SYSTEM // RECRUITMENT SCANNER]</span>
          <span style={{ opacity: 0.8 }} className="desktop-only">STATUS: SCANNING</span>
        </div>

        {/* Filter Inputs */}
        <div className="responsive-stack" style={{ padding: "1.25rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-end" }}>

          {/* Skill — typeable with suggestions */}
          <div style={{ flex: "1 1 auto", minWidth: "170px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", letterSpacing: "0.5px" }}>
              <Zap size={13} color="#d97706" /> SKILL
            </label>
            <input
              list="skill-suggestions"
              placeholder="Type a skill..."
              value={skill}
              onChange={(e) => setSkillFilter(e.target.value)}
              style={{ ...fieldBaseStyle, fontWeight: 600, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.06)" }}
              onFocus={fieldFocusOn}
              onBlur={(e) => fieldFocusOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
              onMouseOver={fieldHoverOn}
              onMouseOut={(e) => fieldHoverOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
            />
            <datalist id="skill-suggestions">
              {facets.skills.map((s: string) => <option key={s} value={s} />)}
            </datalist>
          </div>

          {/* Department */}
          <div style={{ flex: "1 1 auto", minWidth: "170px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", letterSpacing: "0.5px" }}>
              <Building2 size={13} color="#5b5fc7" /> DEPARTMENT
            </label>
            <select
              value={department}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ ...fieldBaseStyle, boxShadow: "2px 2px 0px rgba(0,0,0,0.1)", cursor: "pointer" }}
              onFocus={fieldFocusOn}
              onBlur={fieldFocusOff}
              onMouseOver={fieldHoverOn}
              onMouseOut={fieldHoverOff}
            >
              <option value="">All Departments</option>
              {facets.departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", letterSpacing: "0.5px" }}>
              <User size={13} color="#059669" /> GENDER
            </label>
            <select
              value={gender}
              onChange={(e) => setGenderFilter(e.target.value)}
              style={{ ...fieldBaseStyle, boxShadow: "2px 2px 0px rgba(0,0,0,0.1)", cursor: "pointer" }}
              onFocus={fieldFocusOn}
              onBlur={fieldFocusOff}
              onMouseOver={fieldHoverOn}
              onMouseOut={fieldHoverOff}
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Min Hackathons */}
          <div style={{ flex: "1 1 auto", minWidth: "180px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", letterSpacing: "0.5px" }}>
              <Trophy size={13} color="#d97706" /> MIN HACKATHONS
            </label>
            <select
              value={minHackathons}
              onChange={(e) => setMinHackathonsFilter(e.target.value)}
              style={{ ...fieldBaseStyle, boxShadow: "2px 2px 0px rgba(0,0,0,0.1)", cursor: "pointer" }}
              onFocus={fieldFocusOn}
              onBlur={fieldFocusOff}
              onMouseOver={fieldHoverOn}
              onMouseOut={fieldHoverOff}
            >
              <option value="">Any Experience</option>
              <option value="1">1+ Hackathon</option>
              <option value="2">2+ Hackathons</option>
              <option value="3">3+ Hackathons</option>
              <option value="5">5+ Hackathons</option>
            </select>
          </div>

          {/* Search by Name/College */}
          <div style={{ flex: "2 1 auto", minWidth: "200px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#1a1a1a", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem", letterSpacing: "0.5px" }}>
              <Search size={13} color="#5b5fc7" /> SEARCH
            </label>
            <input
              placeholder="Search by name or college..."
              value={searchQuery}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ ...fieldBaseStyle, fontWeight: 600, boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.06)" }}
              onFocus={fieldFocusOn}
              onBlur={(e) => fieldFocusOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
              onMouseOver={fieldHoverOn}
              onMouseOut={(e) => fieldHoverOff(e, "inset 1px 1px 2px rgba(0,0,0,0.06)")}
            />
          </div>

        </div>
      </div>

      {/* ── Grid or Empty State ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ height: 220, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#888", fontSize: "0.9rem" }}>
              [LOADING DOSSIERS...]
            </div>
          ))}
        </div>
      ) : hackers.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", padding: "3rem 2rem", textAlign: "center", borderRadius: "6px", maxWidth: "600px", margin: "2rem auto" }}>
          <div style={{ display: "inline-flex", width: 64, height: 64, borderRadius: "8px", background: "#eef0ff", border: "2px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
            <SearchX size={32} color="#5b5fc7" />
          </div>
          <h3 style={{ fontSize: "1.25rem", color: "#1a1a1a", fontWeight: 800 }}>No hackers found</h3>
          <p style={{ color: "#5a5a5a" }}>Everyone matching those filters seems to be in a team already. Try widening your criteria.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {hackers.map((hacker: any) => (
              <div key={hacker.id} style={{ 
                background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", 
                borderRadius: "6px", display: "flex", flexDirection: "column"
              }}>
                <div style={{ padding: "1.25rem" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", margin: "0 0 0.2rem" }}>{hacker.name}</h3>
                  <p style={{ color: "#5a5a5a", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", margin: "0 0 0.15rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Building2 size={14} color="#5b5fc7" /> {hacker.department || "Dept N/A"}
                    </span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <User size={14} color="#059669" /> {hacker.gender || "N/A"}
                    </span>
                  </p>
                  {hacker.college && (
                    <p style={{ color: "#888", fontSize: "0.78rem", fontWeight: 600, fontFamily: "var(--font-mono)", margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <GraduationCap size={14} color="#d97706" /> {hacker.college}
                    </p>
                  )}

                  {hacker.bio && (
                    <p style={{ fontSize: "0.9rem", color: "#444", marginBottom: "1rem", fontStyle: "italic" }}>
                      &quot;{hacker.bio}&quot;
                    </p>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                    {hacker.skills.map((s: any) => (
                      <span key={s.skill} style={{ 
                        background: "#fdfbf7", border: "1.5px solid #1a1a1a", 
                        padding: "3px 8px", borderRadius: "3px", fontSize: "0.75rem", 
                        fontWeight: 700, fontFamily: "var(--font-mono)",
                        display: "inline-flex", alignItems: "center", gap: "0.3rem" 
                      }}>
                        <Zap size={12} color="#d97706" /> {s.skill}
                      </span>
                    ))}
                    {hacker.skills.length === 0 && (
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600, fontStyle: "italic" }}>
                        No skills listed yet
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Trophy size={13} color="#d97706" /> Hackathons: {hacker.past_hackathons_count}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Presentation size={13} color="#5b5fc7" /> Soft Skills: {hacker.presentation_skill_rating}/5
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "2px solid #1a1a1a", padding: "1rem", background: "#fdfbf7", marginTop: "auto" }}>
                  {ledTeamId ? (
                    invitedUserIds.has(hacker.id) ? (
                      <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#059669", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                        <CircleCheck size={15} /> Invite pending — awaiting their decision
                      </div>
                    ) : (
                    <button 
                      onClick={() => handleInvite(hacker.id)}
                      disabled={invitingId === hacker.id}
                      style={{
                        width: "100%", background: "#1a1a1a", color: "#ffffff", border: "2px solid #1a1a1a",
                        padding: "0.6rem 1rem", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem",
                        borderRadius: "4px", boxShadow: "3px 3px 0px #5b5fc7", cursor: invitingId === hacker.id ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease", textTransform: "uppercase",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem"
                      }}
                    >
                      {invitingId === hacker.id ? "INVITING..." : <><Send size={15} /> INVITE TO TEAM</>}
                    </button>
                    )
                  ) : (
                    <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#666", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}>
                      <Users size={14} /> You must lead a team to send invites.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.8rem", color: "#666", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                [PAGE {page} / {totalPages}] — {total} SOLO HACKERS ON FILE
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={{ ...paginationButtonStyle, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  <ChevronLeft size={16} /> PREV
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pg = i + 1;
                  if (totalPages > 5) {
                    if (page <= 3) pg = i + 1;
                    else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                    else pg = page - 2 + i;
                  }
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      style={{
                        ...paginationButtonStyle,
                        background: page === pg ? "#5b5fc7" : "#1a1a1a",
                        boxShadow: page === pg ? "2px 2px 0px #1a1a1a" : "2px 2px 0px #5b5fc7",
                      }}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  style={{ ...paginationButtonStyle, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                >
                  NEXT <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
