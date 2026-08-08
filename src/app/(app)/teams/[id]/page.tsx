"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TeamCard from "@/components/TeamCard";
import { SkillSelector } from "@/components/SkillSelector";
import { ProfileInlineEditor } from "@/components/ProfileInlineEditor";
import { TeamSpecEditor } from "@/components/TeamSpecEditor";
import { createClient } from "@/lib/supabase/client";

export default function TeamDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [selectedNewLeaderId, setSelectedNewLeaderId] = useState("");
  const [applicantBio, setApplicantBio] = useState("");
  const [applicantSkills, setApplicantSkills] = useState<string[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Refetch just the team (roster/status) — used by realtime + polling so a new
  // teammate appears without resetting any in-progress form state.
  const fetchTeam = useCallback(async () => {
    const res = await fetch(`/api/teams/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setTeam(data.team);
    }
  }, [params.id]);

  useEffect(() => {
    async function fetchTeamAndProfile() {
      const [resTeam, resProfile] = await Promise.all([
        fetch(`/api/teams/${params.id}`),
        fetch(`/api/users/profile`)
      ]);
      if (resTeam.ok) {
        const data = await resTeam.json();
        setTeam(data.team);
      }
      if (resProfile.ok) {
        const data = await resProfile.json();
        setCurrentUserProfile(data.profile);
        if (data.profile) {
          setApplicantBio(data.profile.bio || "");
          setApplicantSkills(data.profile.skills?.map((s: any) => s.skill) || []);
          setPortfolioUrl(data.profile.portfolio_url || "");
          setLinkedinUrl(data.profile.linkedin_url || "");
          setGithubUrl(data.profile.github_url || "");
        }
      }
      setLoading(false);
    }
    fetchTeamAndProfile();

    // Live roster updates: a teammate accepting my invite INSERTs a membership.
    const membersChannel = supabase
      .channel(`team_members_${params.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_memberships", filter: `team_id=eq.${params.id}` },
        () => {
          fetchTeam();
        }
      )
      .subscribe();

    // Fallback polling so the roster reflects changes even without Realtime.
    const poll = setInterval(fetchTeam, 15000);

    const statusChannel = supabase
      .channel(`team_${params.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "teams", filter: `id=eq.${params.id}` },
        (payload) => {
          if (payload.new && payload.new.status) {
            setTeam((prev: any) => ({ ...prev, status: payload.new.status }));
            if (payload.new.status === "full") {
              setMessage({ type: "error", text: "This team has just become full and is no longer accepting requests." });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(statusChannel);
      clearInterval(poll);
    };
  }, [params.id, supabase, fetchTeam]);

  async function handleRequestToJoin() {
    if (!applicantBio.trim()) {
      setMessage({ type: "error", text: "Please provide a bio or description." });
      return;
    }
    if (portfolioUrl && !/^https?:\/\/\S+$/.test(portfolioUrl)) {
      setMessage({ type: "error", text: "Please provide a valid Portfolio URL (e.g. https://yourportfolio.dev)." });
      return;
    }
    if (linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(linkedinUrl)) {
      setMessage({ type: "error", text: "Please provide a valid LinkedIn URL (e.g. https://linkedin.com/in/username)." });
      return;
    }
    if (githubUrl && !/^https?:\/\/(www\.)?github\.com\/.+/.test(githubUrl)) {
      setMessage({ type: "error", text: "Please provide a valid GitHub URL (e.g. https://github.com/username)." });
      return;
    }
    setRequestLoading(true);
    setMessage(null);
    const res = await fetch(`/api/join-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: team.id, direction: "user_to_team", applicantBio, applicantSkills, portfolioUrl, linkedinUrl, githubUrl }),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Join request sent successfully! Team members will review your profile." });
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to send request." });
    }
    setRequestLoading(false);
  }

  const isLeader = currentUserProfile?.id && team?.leader?.id === currentUserProfile?.id;
  const isTeammate = currentUserProfile?.id && team?.memberships?.some((m: any) => m.user.id === currentUserProfile.id);
  const isMemberOnly = isTeammate && !isLeader;
  const teamMembers = team?.memberships?.map((m: any) => m.user).filter((u: any) => u.id !== currentUserProfile?.id) || [];

  async function handleLeaveTeam() {
    if (!confirm("Are you sure you want to leave this team?")) return;
    setTransferLoading(true);
    setMessage(null);
    const res = await fetch(`/api/teams/${team.id}/leave`, { method: "POST" });
    if (res.ok) {
      setMessage({ type: "success", text: "You have left the team." });
      setTimeout(() => window.location.href = "/dashboard", 1500);
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to leave team." });
      setTransferLoading(false);
    }
  }

  async function handleRemoveMember(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to remove ${userName} from this team? They will be notified and their spot will open up.`)) return;
    setRemovingMemberId(userId);
    setMessage(null);
    const res = await fetch(`/api/teams/${team.id}/remove-member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (res.ok) {
      setTeam((prev: { memberships: { user: { id: string } }[] } | null) => ({
        ...prev,
        memberships: prev?.memberships.filter((m) => m.user.id !== userId),
      }));
      setMessage({ type: "success", text: `${userName} has been removed from the team.` });
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to remove member." });
    }
    setRemovingMemberId(null);
  }

  async function handleDissolveTeam() {
    if (!confirm("Are you sure you want to DISSOLVE this team? All members will be removed and requests cancelled. This is irreversible.")) return;
    setTransferLoading(true);
    setMessage(null);
    const res = await fetch(`/api/teams/${team.id}/dissolve`, { method: "POST" });
    if (res.ok) {
      setMessage({ type: "success", text: "Team dissolved successfully." });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to dissolve team." });
      setTransferLoading(false);
    }
  }


  if (loading) {
    return (
      <div className="page-container" style={{ padding: "4rem 1.25rem", textAlign: "center" }}>
        <div style={{ height: 200, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#888" }}>
          [LOADING TEAM DOSSIER...]
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="page-container" style={{ padding: "4rem 1.25rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", borderRadius: "6px", padding: "3rem 1.5rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>❓</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem" }}>Dossier Not Found</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>The team profile you are trying to view does not exist or has been disbanded.</p>
          <button onClick={() => router.push("/dashboard")} style={{ padding: "0.75rem 1.5rem", background: "#5b5fc7", color: "#fff", border: "2px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a", fontWeight: 800, fontFamily: "var(--font-mono)", borderRadius: "4px", cursor: "pointer", textTransform: "uppercase" }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: "2.5rem 1.25rem", maxWidth: "820px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "2rem" }}>
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
          $ CAT ./DOSSIERS/{team.id?.slice(0, 8)}.LOG
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
          Team Dossier // {team.name}
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
          Comprehensive architectural and personnel report for this SIH squad profile.
        </p>
      </div>

      {(isLeader || isTeammate) && team.status !== 'dissolved' && (
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {isLeader && (
            <button
              onClick={() => setEditingTeam(true)}
              style={{
                padding: "0.6rem 1.15rem",
                background: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "3px 3px 0px #5b5fc7",
                borderRadius: "4px",
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              ✏️ Edit Team Specifications
            </button>
          )}
          <button
            onClick={() => setEditingProfile(true)}
            style={{
              padding: "0.6rem 1.15rem",
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px #059669",
              borderRadius: "4px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            ✏️ Edit My Profile
          </button>
        </div>
      )}
      
      {team.status === 'dissolved' && (
        <div style={{ marginBottom: "2rem", padding: "1.25rem", background: "#fef2f2", border: "2px solid #dc2626", boxShadow: "4px 4px 0px #dc2626", borderRadius: "6px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#991b1b", margin: "0 0 0.5rem" }}>⚠️ TEAM DISSOLVED</h2>
          <p style={{ color: "#991b1b", margin: 0, fontWeight: 500, fontSize: "0.95rem" }}>This team has been dissolved by the leader. It is no longer active.</p>
        </div>
      )}

      <TeamCard team={team} hideCTA />

      {editingTeam && isLeader && (
        <TeamSpecEditor
          team={team}
          onSaved={() => { fetchTeam(); }}
          onClose={() => setEditingTeam(false)}
        />
      )}

      {editingProfile && isTeammate && (
        <ProfileInlineEditor
          profile={currentUserProfile}
          onSaved={(p) => { setCurrentUserProfile(p); fetchTeam(); }}
          onClose={() => setEditingProfile(false)}
        />
      )}

      {/* Application Section */}
      {team.status !== 'dissolved' && !isTeammate && (
        <div 
          style={{ 
            marginTop: "2rem", 
            background: "#ffffff", 
            border: "2px solid #1a1a1a", 
            boxShadow: "5px 5px 0px #1a1a1a", 
            borderRadius: "6px", 
            padding: "2rem",
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
            [APPLICATION REQUISITION]
          </div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.6rem", margin: "0 0 0.5rem" }}>
            Interested in joining this squad?
          </h3>
          <p style={{ color: "#4a4a4a", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem", fontWeight: 500 }}>
            By requesting to join, existing squad members will review your academic qualifications and skill gaps. Your personal phone and WhatsApp contact info remains strictly encrypted and hidden until your enlistment is officially approved!
          </p>

          {message && (
            <div style={{ 
              marginBottom: "1.25rem", 
              padding: "0.85rem 1.1rem", 
              borderRadius: "4px", 
              fontSize: "0.9rem",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              background: message.type === "success" ? "#d1fae5" : "#fef2f2",
              border: `2px solid ${message.type === "success" ? "#065f46" : "#dc2626"}`,
              boxShadow: `3px 3px 0px ${message.type === "success" ? "#065f46" : "#dc2626"}`,
              color: message.type === "success" ? "#065f46" : "#dc2626"
            }}>
              {message.type === "success" ? "🎉 [SUCCESS]: " : "⚠️ [ERROR]: "}{message.text}
            </div>
          )}

          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Your Bio / Description <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                value={applicantBio}
                onChange={(e) => setApplicantBio(e.target.value)}
                placeholder="Tell the team about yourself, why you'd be a good fit, etc..."
                rows={3}
                style={{
                  border: "2px solid #1a1a1a",
                  borderRadius: "4px",
                  padding: "0.65rem 0.85rem",
                  background: "#fdfbfa",
                  color: "#1a1a1a",
                  fontWeight: 500,
                  fontSize: "0.95rem",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: "80px",
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Your Skills
              </label>
              <SkillSelector selectedSkills={applicantSkills} onChange={setApplicantSkills} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.35rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  LinkedIn URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  style={{
                    border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.55rem 0.75rem",
                    background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.9rem",
                    width: "100%", boxSizing: "border-box", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.35rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                  GitHub URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  style={{
                    border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.55rem 0.75rem",
                    background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.9rem",
                    width: "100%", boxSizing: "border-box", outline: "none",
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.35rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Portfolio Website URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://yourportfolio.dev/"
                style={{
                  border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.55rem 0.75rem",
                  background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.9rem",
                  width: "100%", boxSizing: "border-box", outline: "none",
                }}
              />
            </div>
          </div>

          <button 
            onClick={handleRequestToJoin} 
            disabled={requestLoading || team.status === "full"}
            style={{ 
              width: "100%", 
              padding: "0.95rem",
              background: team.status === "full" ? "#e5e7eb" : "#5b5fc7", 
              color: team.status === "full" ? "#6b7280" : "#ffffff", 
              border: team.status === "full" ? "2px solid #9ca3af" : "2px solid #1a1a1a", 
              boxShadow: team.status === "full" ? "none" : "4px 4px 0px #1a1a1a", 
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "1.05rem",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              cursor: team.status === "full" ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
              minHeight: "48px"
            }}
          >
            {requestLoading ? "Submitting Application Dossier..." : team.status === "full" ? "⚠️ Team Capacity Reached (Full)" : "📨 Submit Enlistment Application"}
          </button>
        </div>
      )}

      {/* Action Section for Teammates */}
      {isLeader && team.status !== 'dissolved' && (
        <div style={{ marginTop: "1.5rem", maxWidth: "500px", background: "#fff7ed", border: "2px solid #ea580c", boxShadow: "5px 5px 0px #ea580c", borderRadius: "6px", padding: "2rem", boxSizing: "border-box" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#9a3412", marginBottom: "0.6rem", margin: "0 0 0.5rem" }}>Manage Squad Members</h3>
          <p style={{ color: "#9a3412", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem", fontWeight: 500 }}>
            Remove a member to free up their spot. The removed member will be notified and can browse other teams again.
          </p>
          {teamMembers.length === 0 && (
            <div style={{ fontSize: "0.9rem", color: "#c2410c", fontStyle: "italic" }}>
              No other members to manage yet.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {teamMembers.map((m: { id: string; name: string; department: string | null }) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", background: "#ffffff", border: "2px solid #ea580c", borderRadius: "4px", padding: "0.55rem 0.8rem", boxSizing: "border-box" }}>
                <div style={{ fontWeight: 800, color: "#1a1a1a", fontSize: "0.95rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.name}
                  <span style={{ color: "#6b7280", marginLeft: "0.25rem", fontWeight: 600, fontSize: "0.75rem" }}>
                    ({m.department || "Dept N/A"})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveMember(m.id, m.name)}
                  disabled={removingMemberId === m.id}
                  style={{
                    flexShrink: 0,
                    padding: "0.45rem 0.9rem",
                    background: removingMemberId === m.id ? "#e5e7eb" : "#dc2626",
                    color: removingMemberId === m.id ? "#6b7280" : "#ffffff",
                    border: "2px solid #7f1d1d",
                    boxShadow: "2px 2px 0px #7f1d1d",
                    borderRadius: "4px",
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    cursor: removingMemberId === m.id ? "not-allowed" : "pointer",
                    opacity: removingMemberId === m.id ? 0.6 : 1,
                  }}
                >
                  {removingMemberId === m.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLeader && team.status !== 'dissolved' && (
        <div style={{ marginTop: "1.5rem", maxWidth: "500px", background: "#fef2f2", border: "2px solid #dc2626", boxShadow: "5px 5px 0px #dc2626", borderRadius: "6px", padding: "2rem", boxSizing: "border-box" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#991b1b", marginBottom: "0.6rem", margin: "0 0 0.5rem" }}>Dissolve Team</h3>
          <p style={{ color: "#991b1b", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem", fontWeight: 500 }}>
            This action is irreversible. All current members will be removed, pending requests will be cancelled, and the team will be permanently marked as dissolved.
          </p>
          <button onClick={handleDissolveTeam} disabled={transferLoading} style={{ padding: "0.75rem 1.5rem", background: "#dc2626", color: "#ffffff", border: "2px solid #7f1d1d", boxShadow: "3px 3px 0px #7f1d1d", borderRadius: "4px", fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase", cursor: transferLoading ? "not-allowed" : "pointer", opacity: transferLoading ? 0.6 : 1 }}>
            {transferLoading ? "Dissolving..." : "Dissolve Team"}
          </button>
        </div>
      )}

      {isMemberOnly && team.status !== 'dissolved' && (
        <div style={{ marginTop: "1.5rem", maxWidth: "500px", background: "#fef2f2", border: "2px solid #dc2626", boxShadow: "5px 5px 0px #dc2626", borderRadius: "6px", padding: "2rem", boxSizing: "border-box" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#991b1b", marginBottom: "0.6rem", margin: "0 0 0.5rem" }}>Leave Team</h3>
          <p style={{ color: "#991b1b", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem", fontWeight: 500 }}>
            You will be removed from this team and your spot will become available. You will be free to join another team.
          </p>
          <button onClick={handleLeaveTeam} disabled={transferLoading} style={{ padding: "0.75rem 1.5rem", background: "#dc2626", color: "#ffffff", border: "2px solid #7f1d1d", boxShadow: "3px 3px 0px #7f1d1d", borderRadius: "4px", fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase", cursor: transferLoading ? "not-allowed" : "pointer", opacity: transferLoading ? 0.6 : 1 }}>
            {transferLoading ? "Leaving..." : "Leave Team"}
          </button>
        </div>
      )}
    </div>
  );
}
