"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TeamCard from "@/components/TeamCard";
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
      }
      setLoading(false);
    }
    fetchTeamAndProfile();

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }, [params.id, supabase]);

  async function handleRequestToJoin() {
    setRequestLoading(true);
    setMessage(null);
    const res = await fetch(`/api/join-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: team.id, direction: "user_to_team" }),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Join request sent successfully! Team members will review your profile." });
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to send request." });
    }
    setRequestLoading(false);
  }

  async function handleTransferLeadership() {
    if (!selectedNewLeaderId) {
      setMessage({ type: "error", text: "Please select a member to transfer leadership to." });
      return;
    }
    setTransferLoading(true);
    setMessage(null);
    const res = await fetch(`/api/teams/${team.id}/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_leader_id: selectedNewLeaderId }),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Leadership transferred successfully!" });
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to transfer leadership." });
    }
    setTransferLoading(false);
  }

  const isLeader = currentUserProfile?.id && team?.leader?.id === currentUserProfile?.id;
  const teamMembers = team?.memberships?.map((m: any) => m.user).filter((u: any) => u.id !== currentUserProfile?.id) || [];


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

      <TeamCard team={team} hideCTA />

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

      {/* Transfer Leadership Section for Leader */}
      {isLeader && teamMembers.length > 0 && (
        <div 
          style={{ 
            marginTop: "1.5rem", 
            background: "#fffbeb", 
            border: "2px solid #d97706", 
            boxShadow: "5px 5px 0px #d97706", 
            borderRadius: "6px", 
            padding: "2rem",
            boxSizing: "border-box"
          }}
        >
          <div style={{ fontSize: "0.72rem", color: "#b45309", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
            [LEADER ACTIONS]
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#92400e", marginBottom: "0.6rem", margin: "0 0 0.5rem" }}>
            Transfer Leadership
          </h3>
          <p style={{ color: "#92400e", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem", fontWeight: 500 }}>
            Pass your leadership role to another team member. This action cannot be undone unless they transfer it back to you.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <select
              value={selectedNewLeaderId}
              onChange={(e) => setSelectedNewLeaderId(e.target.value)}
              style={{
                flex: 1, padding: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem",
                background: "#ffffff", border: "2px solid #b45309", borderRadius: "4px", outline: "none", cursor: "pointer"
              }}
            >
              <option value="">Select a member...</option>
              {teamMembers.map((member: any) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.department})
                </option>
              ))}
            </select>
            <button
              onClick={handleTransferLeadership}
              disabled={transferLoading || !selectedNewLeaderId}
              style={{
                padding: "0.75rem 1.5rem", background: "#d97706", color: "#ffffff",
                border: "2px solid #78350f", boxShadow: "3px 3px 0px #78350f", borderRadius: "4px",
                fontWeight: 800, fontFamily: "var(--font-mono)", textTransform: "uppercase",
                cursor: transferLoading || !selectedNewLeaderId ? "not-allowed" : "pointer",
                opacity: transferLoading || !selectedNewLeaderId ? 0.6 : 1, transition: "all 0.15s ease"
              }}
            >
              {transferLoading ? "Transferring..." : "Transfer Role"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
