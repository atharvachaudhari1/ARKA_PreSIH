"use client";

import { useState } from "react";
import { IconConsoleAlert } from "./TerminalIcons";

interface ReportModalProps {
  targetId: string;
  targetType: "user" | "team";
  targetName: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  "Inappropriate Content",
  "Harassment or Abuse",
  "Spam or Misleading",
  "Violation of Hackathon Rules",
  "Other"
];

export default function ReportModal({ targetId, targetType, targetName, onClose }: ReportModalProps) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [targetType === "user" ? "reported_user_id" : "reported_team_id"]: targetId,
          reason,
          description
        })
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(26, 26, 26, 0.4)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 9999, width: "100%", maxWidth: 450, padding: "1.5rem",
        background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "8px 8px 0px #1a1a1a",
        borderRadius: "6px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", borderBottom: "2px solid #1a1a1a", paddingBottom: "0.75rem" }}>
          <div style={{ background: "#fef2f2", padding: "0.25rem", borderRadius: "4px", border: "2px solid #dc2626", boxShadow: "2px 2px 0px #dc2626" }}>
            <IconConsoleAlert size={20} color="#dc2626" />
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 900, fontFamily: "var(--font-mono)", color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            REPORT {targetType.toUpperCase()}
          </h2>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669", marginBottom: "0.5rem" }}>Report Submitted</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Our moderation team will review your report shortly. Thank you for keeping the community safe.
            </p>
            <button 
              onClick={onClose}
              style={{
                width: "100%", background: "#1a1a1a", color: "#ffffff", border: "2px solid #1a1a1a",
                padding: "0.6rem 1rem", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem",
                borderRadius: "4px", boxShadow: "3px 3px 0px #5b5fc7", cursor: "pointer", transition: "all 0.15s ease"
              }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>
              You are reporting {targetType}: <strong style={{ fontFamily: "var(--font-mono)", background: "#f0ece4", padding: "0.1rem 0.4rem", borderRadius: "3px" }}>{targetName}</strong>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", marginBottom: "0.4rem", color: "#1a1a1a" }}>REASON</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                style={{
                  width: "100%", padding: "0.6rem 0.8rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem",
                  background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a",
                  outline: "none", cursor: "pointer"
                }}
              >
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", marginBottom: "0.4rem", color: "#1a1a1a" }}>DETAILS (OPTIONAL)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide any additional context..."
                style={{
                  width: "100%", padding: "0.6rem 0.8rem", fontFamily: "var(--font-sans)", fontSize: "0.9rem",
                  background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a",
                  outline: "none", resize: "none"
                }}
              />
            </div>

            {error && (
              <div style={{ padding: "0.5rem 0.75rem", background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "4px", color: "#dc2626", fontSize: "0.85rem", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                Error: {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1, background: "#ffffff", color: "#1a1a1a", border: "2px solid #1a1a1a",
                  padding: "0.6rem", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem",
                  borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a", cursor: "pointer", transition: "all 0.15s ease"
                }}
              >
                CANCEL
              </button>
              <button 
                type="submit"
                disabled={loading}
                style={{
                  flex: 1, background: "#dc2626", color: "#ffffff", border: "2px solid #1a1a1a",
                  padding: "0.6rem", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem",
                  borderRadius: "4px", boxShadow: "3px 3px 0px #1a1a1a", cursor: "pointer", transition: "all 0.15s ease",
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "SUBMITTING..." : "SUBMIT REPORT"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
