"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";

function IconInbox() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}

export default function RequestsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [teamRequests, setTeamRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "team">("my");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

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
    if (res.ok) {
      showToast(`Opinion recorded: ${opinion}`);
      fetchRequests();
    } else {
      showToast("Failed to record opinion", "error");
    }
  }

  async function handleDecision(requestId: string, decision: "accept" | "reject") {
    const res = await fetch(`/api/join-requests/${requestId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    if (res.ok) {
      showToast(`Applicant ${decision}ed successfully!`);
      fetchRequests();
    } else {
      const error = await res.json();
      showToast(error.error || "Failed to make decision", "error");
    }
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 800 }}>
      <div style={{ marginBottom: "2rem" }}>
      <p className="section-title" style={{ marginBottom: "0.4rem" }}>Requests</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Join <span className="gradient-text">Requests</span></h1>
      </div>

      {toastMessage && (
        <div style={{ 
          marginBottom: "1.5rem", 
          padding: "1rem", 
          borderRadius: "var(--radius-md)", 
          background: toastMessage.type === "success" ? "rgba(52, 211, 153, 0.15)" : "rgba(246, 70, 104, 0.15)", 
          border: `1px solid ${toastMessage.type === "success" ? "rgba(52, 211, 153, 0.3)" : "rgba(246, 70, 104, 0.3)"}`,
          color: toastMessage.type === "success" ? "#34d399" : "var(--ember-coral)",
          display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500
        }}>
          {toastMessage.type === "success" ? "✓" : "✕"} {toastMessage.text}
        </div>
      )}

      <div className="tab-bar" style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("my")}
          className={`tab-btn${activeTab === "my" ? " active" : ""}`}
        >
          My Requests ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`tab-btn${activeTab === "team" ? " active" : ""}`}
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
            <EmptyState
              icon={<IconInbox />}
              title="No pending requests"
              description="You haven't sent any join requests yet. Browse teams to find a match!"
              ctaText="Browse Teams"
              ctaHref="/teams"
            />
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
                      background: req.status === "pending" ? "rgba(254,150,119,0.12)" : req.status === "accepted" ? "rgba(52,211,153,0.12)" : "rgba(246,70,104,0.12)",
                      color: req.status === "pending" ? "var(--ember-peach)" : req.status === "accepted" ? "#34d399" : "var(--ember-coral)",
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
            <EmptyState
              icon={<IconInbox />}
              title="No pending applications"
              description="No one has applied to join your team yet."
            />
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
                        <span key={s.skill} className="skill-chip">{s.skill}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ background: "var(--color-bg-elevated)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
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
                      <button onClick={() => handleDecision(req.id, "accept")} className="btn btn-primary btn-sm">
                        Accept Applicant
                      </button>
                      <button onClick={() => handleDecision(req.id, "reject")} className="btn btn-danger btn-sm">
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
