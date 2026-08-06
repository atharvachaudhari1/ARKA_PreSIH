"use client";

import { useState, useEffect, useCallback } from "react";

import useSWR, { mutate } from "swr";
import { isStrongMatch } from "@/lib/recommendation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<"my" | "team" | "outbound">("my");
  const [hasSetTab, setHasSetTab] = useState(false);

  const { data: profileData } = useSWR('/api/users/profile', fetcher);
  const currentUserId = profileData?.profile?.id || null;

  const { data: requestsData, isLoading: loading } = useSWR('/api/join-requests', fetcher, {
    onSuccess: (data) => {
      if (!hasSetTab && data.teamRequests?.length > 0 && data.myRequests?.length === 0) {
        setActiveTab("team");
        setHasSetTab(true);
      }
    }
  });

  const myRequests = requestsData?.myRequests || [];
  const teamRequests = requestsData?.teamRequests || [];
  const outboundInvites = requestsData?.outboundInvites || [];

  async function handleOpinion(requestId: string, opinion: "approve" | "reject" | "neutral") {
    const res = await fetch(`/api/join-requests/${requestId}/opinion`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opinion })
    });
    if (res.ok) mutate('/api/join-requests');
  }

  async function handleDecision(requestId: string, decision: "accept" | "reject") {
    const res = await fetch(`/api/join-requests/${requestId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    if (res.ok) {
      mutate('/api/join-requests');
      mutate('/api/users/profile'); // user might have joined a team
    } else {
      const error = await res.json();
      alert(error.error || "Failed to make decision");
    }
  }

  async function handleCancel(requestId: string) {
    const res = await fetch(`/api/join-requests/${requestId}/cancel`, { method: "DELETE" });
    if (res.ok) mutate('/api/join-requests');
  }

  return (
    <div className="page-container" style={{ padding: "2.5rem 1.25rem", maxWidth: "860px", margin: "0 auto", boxSizing: "border-box" }}>
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
          $ TAIL -F ./JOIN_REQUESTS.LOG
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
          Join Requests & Applications
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
          Track your active outbound applications and process inbound candidate dossiers for your squad.
        </p>
      </div>

      {/* ── Switchboard Tabs (Responsive Stacking on Phone) ── */}
      <div className="responsive-stack" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #1a1a1a", paddingBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("my")}
          className="btn-mobile-full"
          style={{
            padding: "0.75rem 1.25rem",
            background: activeTab === "my" ? "#1a1a1a" : "#fdfbf7",
            color: activeTab === "my" ? "#ffffff" : "#1a1a1a",
            border: "2px solid #1a1a1a",
            boxShadow: activeTab === "my" ? "4px 4px 0px #5b5fc7" : "3px 3px 0px #1a1a1a",
            borderRadius: "4px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
            minHeight: "44px"
          }}
        >
          📤 My Applications ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className="btn-mobile-full"
          style={{
            padding: "0.75rem 1.25rem",
            background: activeTab === "team" ? "#1a1a1a" : "#fdfbf7",
            color: activeTab === "team" ? "#ffffff" : "#1a1a1a",
            border: "2px solid #1a1a1a",
            boxShadow: activeTab === "team" ? "4px 4px 0px #5b5fc7" : "3px 3px 0px #1a1a1a",
            borderRadius: "4px",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
            minHeight: "44px"
          }}
        >
          📥 Inbound Candidates ({teamRequests.length})
        </button>
        {outboundInvites.length > 0 && (
          <button
            onClick={() => setActiveTab("outbound")}
            className="btn-mobile-full"
            style={{
              padding: "0.75rem 1.25rem",
              background: activeTab === "outbound" ? "#1a1a1a" : "#fdfbf7",
              color: activeTab === "outbound" ? "#ffffff" : "#1a1a1a",
              border: "2px solid #1a1a1a",
              boxShadow: activeTab === "outbound" ? "4px 4px 0px #5b5fc7" : "3px 3px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              fontSize: "0.9rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
              minHeight: "44px"
            }}
          >
            📤 Outbound Invites ({outboundInvites.length})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {[1, 2].map(n => (
            <div key={n} style={{ height: 140, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#888" }}>
              [READING DOSSIERS...]
            </div>
          ))}
        </div>
      ) : activeTab === "my" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {myRequests.length === 0 ? (
            <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", padding: "3rem 2rem", textAlign: "center", borderRadius: "6px", color: "#555", fontWeight: 600 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📭</div>
              <h3 style={{ fontSize: "1.25rem", color: "#1a1a1a", fontWeight: 800, marginBottom: "0.4rem" }}>No active outbound requests</h3>
              <p style={{ fontSize: "0.95rem", margin: 0 }}>You haven&apos;t submitted applications to any teams yet. Head over to the Browse tab to find an open squad!</p>
            </div>
          ) : (
            myRequests.map((req: any) => (
              <div key={req.id} style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", borderRadius: "6px", padding: "1.75rem", boxSizing: "border-box" }}>
                <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", margin: "0 0 0.25rem" }}>{req.team.name}</h3>
                    <div style={{ display: "inline-block", background: "#eef0ff", color: "#1a1a1a", border: "1.5px solid #5b5fc7", padding: "2px 8px", borderRadius: "3px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0.3rem 0 0.6rem" }}>
                      🎯 Domain: {req.team.domain_interest ?? "General Track"}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#666", fontWeight: 600, fontFamily: "var(--font-mono)", margin: 0 }}>
                      [SUBMITTED ON: {new Date(req.created_at).toLocaleDateString()}]
                    </p>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: "5px 12px", 
                        borderRadius: "4px", 
                        fontSize: "0.75rem", 
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        border: "2px solid #1a1a1a",
                        boxShadow: "2px 2px 0px #1a1a1a",
                        display: "inline-block",
                        background: req.status === "pending" ? "#fef3c7" : req.status === "accepted" ? "#d1fae5" : "#fee2e2",
                        color: req.status === "pending" ? "#92400e" : req.status === "accepted" ? "#065f46" : "#991b1b",
                      }}
                    >
                      STATUS: {req.status.toUpperCase()}
                      {req.status === "expired" && req.expired_reason && ` (${req.expired_reason})`}
                    </span>
                  </div>
                </div>
                {req.direction === "team_to_user" && req.status === "pending" && (
                  <div style={{ borderTop: "2px dashed #1a1a1a", paddingTop: "1.25rem", marginTop: "1.25rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.6rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
                      [ACTION REQUIRED: RESPOND TO TEAM INVITE]
                    </div>
                    <div className="responsive-stack" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <button 
                        onClick={() => handleDecision(req.id, "accept")} 
                        className="btn-mobile-full"
                        style={{ 
                          padding: "0.75rem 1.25rem", 
                          background: "#059669", 
                          color: "#ffffff", 
                          border: "2px solid #1a1a1a", 
                          boxShadow: "3px 3px 0px #1a1a1a", 
                          borderRadius: "4px", 
                          fontWeight: 800, 
                          fontFamily: "var(--font-mono)", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.5px", 
                          cursor: "pointer",
                          minHeight: "44px"
                        }}
                      >
                        🎉 Accept Invite
                      </button>
                      <button 
                        onClick={() => handleDecision(req.id, "reject")} 
                        className="btn-mobile-full"
                        style={{ 
                          padding: "0.75rem 1.25rem", 
                          background: "#fef2f2", 
                          color: "#dc2626", 
                          border: "2px solid #dc2626", 
                          boxShadow: "3px 3px 0px #dc2626", 
                          borderRadius: "4px", 
                          fontWeight: 800, 
                          fontFamily: "var(--font-mono)", 
                          textTransform: "uppercase", 
                          letterSpacing: "0.5px", 
                          cursor: "pointer",
                          minHeight: "44px"
                        }}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : activeTab === "team" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {teamRequests.length === 0 ? (
            <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", padding: "3rem 2rem", textAlign: "center", borderRadius: "6px", color: "#555", fontWeight: 600 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📥</div>
              <h3 style={{ fontSize: "1.25rem", color: "#1a1a1a", fontWeight: 800, marginBottom: "0.4rem" }}>No pending candidate applications</h3>
              <p style={{ fontSize: "0.95rem", margin: 0 }}>Your team currently has no unreviewed inbound applicant dossiers.</p>
            </div>
          ) : (
            teamRequests.map((req: any) => {
              const myOpinion = req.opinions.find((o: any) => o.member.id === currentUserId);
              return (
                <div key={req.id} style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", borderRadius: "6px", padding: "1.75rem", boxSizing: "border-box" }}>
                  <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.7rem", color: "#777", fontFamily: "var(--font-mono)", fontWeight: 800, letterSpacing: "1px", marginBottom: "0.25rem" }}>
                        [CANDIDATE DOSSIER]
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.2rem" }}>
                        <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>{req.requester.name}</h3>
                        {(() => {
                          const unfilledSlotSkills = req.team.slots
                            ? req.team.slots.filter((s: any) => !s.is_filled).flatMap((s: any) => s.skills)
                            : [];
                          const userSkills = req.requester.skills?.map((s: any) => s.skill) || [];
                          
                          if (isStrongMatch(unfilledSlotSkills, userSkills)) {
                            return (
                              <span style={{ fontSize: "0.7rem", fontWeight: 800, fontFamily: "var(--font-mono)", padding: "2px 6px", borderRadius: "3px", background: "#fffbeb", color: "#d97706", border: "1px solid #d97706", letterSpacing: "0.5px" }}>
                                🔥 STRONG MATCH
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <p style={{ color: "#5a5a5a", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", margin: "0 0 0.25rem" }}>
                        🎓 {req.requester.department} • 👤 {req.requester.gender} • 🏅 {req.requester.past_hackathons_count} Past Hackathons • 🎤 {req.requester.presentation_skill_rating}/5 Presentation
                      </p>
                      {(req.requester.whatsapp_number || req.requester.phone_number) && (
                        <p style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", margin: 0 }}>
                          📞 Contact: {req.requester.whatsapp_number || req.requester.phone_number}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        padding: "4px 10px", 
                        borderRadius: "3px", 
                        fontSize: "0.75rem", 
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        border: "1.5px solid #1a1a1a",
                        boxShadow: "1.5px 1.5px 0px #1a1a1a",
                        background: "#fef3c7", 
                        color: "#92400e",
                        display: "inline-block"
                      }}
                    >
                      ⏳ PENDING REVIEW
                    </span>
                  </div>

                  {req.requester.bio && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.4rem" }}>
                        [CANDIDATE DOSSIER EXTRACT]
                      </div>
                      <div style={{ background: "#fdfbf7", border: "1.5px solid #eae6df", padding: "0.85rem", borderRadius: "4px" }}>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "#4a4a4a", fontWeight: 500, fontStyle: "italic", lineHeight: 1.5 }}>
                          "{req.requester.bio}"
                        </p>
                      </div>
                    </div>
                  )}

                  {req.requester.skills.length > 0 && (
                    <div style={{ marginBottom: "1.25rem" }}>
                      <div style={{ fontSize: "0.7rem", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 800, fontFamily: "var(--font-mono)", marginBottom: "0.4rem" }}>
                        [CANDIDATE TECHNOLOGIES]
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        {req.requester.skills.map((s: any) => (
                          <span key={s.skill} style={{ background: "#fdfbf7", border: "1.5px solid #1a1a1a", boxShadow: "1.5px 1.5px 0px #1a1a1a", color: "#1a1a1a", padding: "3px 8px", borderRadius: "3px", fontSize: "0.75rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                            ⚡ {s.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ background: "#fdfbf7", border: "2px solid #1a1a1a", padding: "1.25rem", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a", boxSizing: "border-box" }}>
                    <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.6rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
                      [SQUAD MEMBER CONSENSUS VOTING]
                    </div>
                    <div className="responsive-stack" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                      <button 
                        onClick={() => handleOpinion(req.id, "approve")}
                        className="btn-mobile-full"
                        style={{
                          padding: "0.6rem 1rem",
                          borderRadius: "4px",
                          border: "2px solid #1a1a1a",
                          boxShadow: "2.5px 2.5px 0px #1a1a1a",
                          background: myOpinion?.opinion === "approve" ? "#d1fae5" : "#ffffff",
                          color: "#065f46",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          minHeight: "44px"
                        }}
                      >
                        👍 Approve ({req.opinions.filter((o: any) => o.opinion === "approve").length})
                      </button>
                      <button 
                        onClick={() => handleOpinion(req.id, "reject")}
                        className="btn-mobile-full"
                        style={{
                          padding: "0.6rem 1rem",
                          borderRadius: "4px",
                          border: "2px solid #1a1a1a",
                          boxShadow: "2.5px 2.5px 0px #1a1a1a",
                          background: myOpinion?.opinion === "reject" ? "#fee2e2" : "#ffffff",
                          color: "#991b1b",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          minHeight: "44px"
                        }}
                      >
                        👎 Reject ({req.opinions.filter((o: any) => o.opinion === "reject").length})
                      </button>
                      <button 
                        onClick={() => handleOpinion(req.id, "neutral")}
                        className="btn-mobile-full"
                        style={{
                          padding: "0.6rem 1rem",
                          borderRadius: "4px",
                          border: "2px solid #1a1a1a",
                          boxShadow: "2.5px 2.5px 0px #1a1a1a",
                          background: myOpinion?.opinion === "neutral" ? "#fef3c7" : "#ffffff",
                          color: "#92400e",
                          fontWeight: 800,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          minHeight: "44px"
                        }}
                      >
                        🤷 Neutral
                      </button>
                    </div>
                    
                    {/* Executive Leader Decision Actions */}
                    <div style={{ borderTop: "2px dashed #1a1a1a", paddingTop: "1.25rem" }}>
                      <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.6rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "0.5px" }}>
                        [EXECUTIVE LEADER DECISION]
                      </div>
                      <div className="responsive-stack" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <button 
                          onClick={() => handleDecision(req.id, "accept")} 
                          className="btn-mobile-full"
                          style={{ 
                            padding: "0.75rem 1.25rem", 
                            background: "#059669", 
                            color: "#ffffff", 
                            border: "2px solid #1a1a1a", 
                            boxShadow: "3px 3px 0px #1a1a1a", 
                            borderRadius: "4px", 
                            fontWeight: 800, 
                            fontFamily: "var(--font-mono)", 
                            textTransform: "uppercase", 
                            letterSpacing: "0.5px", 
                            cursor: "pointer",
                            minHeight: "44px"
                          }}
                        >
                          🎉 Accept Applicant & Enlist
                        </button>
                        <button 
                          onClick={() => handleDecision(req.id, "reject")} 
                          className="btn-mobile-full"
                          style={{ 
                            padding: "0.75rem 1.25rem", 
                            background: "#fef2f2", 
                            color: "#dc2626", 
                            border: "2px solid #dc2626", 
                            boxShadow: "3px 3px 0px #dc2626", 
                            borderRadius: "4px", 
                            fontWeight: 800, 
                            fontFamily: "var(--font-mono)", 
                            textTransform: "uppercase", 
                            letterSpacing: "0.5px", 
                            cursor: "pointer",
                            minHeight: "44px"
                          }}
                        >
                          ✕ Decline Application
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {outboundInvites.length === 0 ? (
            <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", padding: "3rem 2rem", textAlign: "center", borderRadius: "6px", color: "#555", fontWeight: 600 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📤</div>
              <h3 style={{ fontSize: "1.25rem", color: "#1a1a1a", fontWeight: 800, marginBottom: "0.4rem" }}>No active outbound invites</h3>
              <p style={{ fontSize: "0.95rem", margin: 0 }}>You haven&apos;t invited any hackers to your team yet.</p>
            </div>
          ) : (
            outboundInvites.map((req: any) => (
              <div key={req.id} style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", borderRadius: "6px", padding: "1.75rem", boxSizing: "border-box" }}>
                <div className="responsive-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", margin: "0 0 0.25rem" }}>{req.requester.name}</h3>
                    <div style={{ display: "inline-block", background: "#eef0ff", color: "#1a1a1a", border: "1.5px solid #5b5fc7", padding: "2px 8px", borderRadius: "3px", fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 700, margin: "0.3rem 0 0.6rem" }}>
                      🎓 {req.requester.department} • 👤 {req.requester.gender} {(req.requester.whatsapp_number || req.requester.phone_number) && `• 📞 ${req.requester.whatsapp_number || req.requester.phone_number}`}
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "#666", fontWeight: 600, fontFamily: "var(--font-mono)", margin: 0 }}>
                      [SENT ON: {new Date(req.created_at).toLocaleDateString()}]
                    </p>
                  </div>
                  <div>
                    <span
                      style={{
                        padding: "5px 12px", 
                        borderRadius: "4px", 
                        fontSize: "0.75rem", 
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        border: "2px solid #1a1a1a",
                        boxShadow: "2px 2px 0px #1a1a1a",
                        display: "inline-block",
                        background: req.status === "pending" ? "#fef3c7" : req.status === "accepted" ? "#d1fae5" : "#fee2e2",
                        color: req.status === "pending" ? "#92400e" : req.status === "accepted" ? "#065f46" : "#991b1b",
                      }}
                    >
                      STATUS: {req.status.toUpperCase()}
                      {req.status === "expired" && req.expired_reason && ` (${req.expired_reason})`}
                    </span>
                  </div>
                </div>
                {req.status === "pending" && (
                  <div style={{ borderTop: "2px dashed #1a1a1a", paddingTop: "1rem", marginTop: "1rem" }}>
                    <button 
                      onClick={() => handleCancel(req.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer", color: "#dc2626", 
                        fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.8rem", textDecoration: "underline"
                      }}
                    >
                      Cancel Invite
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
