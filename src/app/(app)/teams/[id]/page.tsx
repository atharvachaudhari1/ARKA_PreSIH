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
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  
  useEffect(() => {
    async function fetchTeam() {
      const res = await fetch(`/api/teams/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
      setLoading(false);
    }
    fetchTeam();
  }, [params.id]);

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

  if (loading) {
    return <div className="page-container" style={{ padding: "3rem" }}>Loading team...</div>;
  }

  if (!team) {
    return <div className="page-container" style={{ padding: "3rem" }}>Team not found.</div>;
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 800 }}>
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.4rem" }}>$ cat team.md</p>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Team Details</h1>
      </div>

      <TeamCard team={team} hideCTA />

      <div className="card" style={{ marginTop: "1.5rem", padding: "1.5rem", border: "1px solid var(--color-border-hover)" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>Interested in joining?</h3>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          By requesting to join, the team members will be able to see your profile details (except your contact info, which remains hidden until accepted).
        </p>

        {message && (
          <div style={{ 
            marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", fontSize: "0.875rem",
            background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: message.type === "success" ? "#10b981" : "#ef4444"
          }}>
            {message.text}
          </div>
        )}

        <button 
          onClick={handleRequestToJoin} 
          disabled={requestLoading || team.status === "full"}
          className="btn btn-primary" 
          style={{ width: "100%" }}
        >
          {requestLoading ? "Sending request..." : team.status === "full" ? "Team Full" : "Send Join Request"}
        </button>
      </div>
    </div>
  );
}
