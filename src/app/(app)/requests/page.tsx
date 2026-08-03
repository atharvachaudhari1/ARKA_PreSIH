"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RequestsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Need to fetch internal user id for opinions check
      const resProfile = await fetch('/api/users/profile');
      if (resProfile.ok) {
        const { profile } = await resProfile.json();
        setCurrentUserId(profile.id);
      }
    }

    const res = await fetch("/api/join-requests");
    if (res.ok) {
      const data = await res.json();
      setMyRequests(data.myRequests);
      setTeamRequests(data.teamRequests);
      if (data.teamRequests.length > 0 && data.myRequests.length === 0) {
        setActiveTab("team");
      }
    }
    setLoading(false);
  }, [supabase.auth]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleOpinion(requestId: string, opinion: "approve" | "reject" | "neutral") {
    const res = await fetch(`/api/join-requests/${requestId}/opinion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opinion })
    });
    if (res.ok) fetchRequests();
  }

  async function handleDecision(requestId: string, decision: "accept" | "reject") {
    const res = await fetch(`/api/join-requests/${requestId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    if (res.ok) {
      fetchRequests();
    } else {
      const error = await res.json();
      alert(error.error || "Failed to make decision");
    }
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 800 }}>
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.4rem" }}>$ tail -f requests.log</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Join Requests</h1>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
        <button
          onClick={() => setActiveTab("my")}
          style={{
            padding: "0.75rem 1rem", background: "none", border: "none",
            borderBottom: activeTab === "my" ? "2px solid var(--color-brand)" : "2px solid transparent",
            color: activeTab === "my" ? "var(--color-brand-light)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "my" ? 700 : 500, cursor: "pointer"
          }}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("team")}
          style={{
            padding: "0.75rem 1rem", background: "none", border: "none",
            borderBottom: activeTab === "team" ? "2px solid var(--color-brand)" : "2px solid transparent",
            color: activeTab === "team" ? "var(--color-brand-light)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "team" ? 700 : 500, cursor: "pointer"
          }}
        >
          Team Requests ({teamRequests.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2].map(n => <div key={n} className="card skeleton" style={{ height: 120 }} />)}
        </div>
      ) : activeTab === "my" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {myRequests.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: "2rem", textAlign: "center", border: "1px dashed var(--color-border)" }}>
              No pending requests.
            </p>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{req.team.name}</h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>Domain: {req.team.domain_interest}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                      Sent on {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600,
                      background: req.status === "pending" ? "rgba(245,158,11,0.15)" : req.status === "accepted" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                      color: req.status === "pending" ? "#f59e0b" : req.status === "accepted" ? "#10b981" : "#ef4444",
                    }}
                  >
                    {req.status.toUpperCase()}
                    {req.status === "expired" && req.expired_reason && ` (${req.expired_reason})`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {teamRequests.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: "2rem", textAlign: "center", border: "1px dashed var(--color-border)" }}>
              No pending applications to your team.
            </p>
          ) : (
            teamRequests.map((req) => {
              const myOpinion = req.opinions.find((o: any) => o.member.id === currentUserId);
              return (
                <div key={req.id} className="card" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{req.requester.name}</h3>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                        {req.requester.department} • {req.requester.gender} • {req.requester.past_hackathons_count} Hackathons
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600,
                        background: "rgba(245,158,11,0.15)", color: "#f59e0b",
                      }}
                    >
                      PENDING
                    </span>
                  </div>

                  {req.requester.skills.length > 0 && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                      {req.requester.skills.map((s: any) => (
                        <span key={s.skill} style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-brand-light)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>
                          {s.skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ background: "var(--color-bg-elevated)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Member Opinions</div>
                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                      <button 
                        onClick={() => handleOpinion(req.id, "approve")}
                        className={`btn btn-sm ${myOpinion?.opinion === "approve" ? "btn-primary" : "btn-secondary"}`}
                      >
                        👍 Approve
                      </button>
                      <button 
                        onClick={() => handleOpinion(req.id, "reject")}
                        className={`btn btn-sm ${myOpinion?.opinion === "reject" ? "btn-primary" : "btn-secondary"}`}
                      >
                        👎 Reject
                      </button>
                      <button 
                        onClick={() => handleOpinion(req.id, "neutral")}
                        className={`btn btn-sm ${myOpinion?.opinion === "neutral" ? "btn-primary" : "btn-secondary"}`}
                      >
                        🤷 Neutral
                      </button>
                    </div>
                    
                    {/* Leader actions (Simulated for all team members for now, API enforces role check) */}
                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1rem", display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => handleDecision(req.id, "accept")} className="btn btn-primary btn-sm" style={{ background: "#10b981", borderColor: "#10b981" }}>
                        Accept Applicant
                      </button>
                      <button onClick={() => handleDecision(req.id, "reject")} className="btn btn-secondary btn-sm" style={{ color: "#ef4444" }}>
                        Reject Applicant
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
