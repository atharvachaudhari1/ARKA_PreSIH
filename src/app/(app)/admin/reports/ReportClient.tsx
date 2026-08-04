"use client";

import { useState } from "react";
import EmptyState from "@/components/EmptyState";

type Report = {
  id: string;
  reporter: { name: string, email: string };
  reported_user: { name: string, email: string } | null;
  reported_team: { name: string } | null;
  reason: string;
  description: string | null;
  created_at: Date;
};

export default function ReportClient({ initialReports }: { initialReports: Report[] }) {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function handleAction(reportId: string, action: "resolved" | "dismissed") {
    setLoadingAction(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      
      if (res.ok) {
        setReports(reports.filter(r => r.id !== reportId));
      } else {
        alert("Failed to update report status");
      }
    } catch (e) {
      alert("Error updating report");
    }
    setLoadingAction(null);
  }

  if (reports.length === 0) {
    return (
      <EmptyState 
        title="No Open Reports" 
        description="All clear! There are no open reports to review." 
        icon="🎉" 
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {reports.map(report => (
        <div key={report.id} className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ 
                  background: "rgba(239, 68, 68, 0.1)", 
                  color: "#ef4444", 
                  padding: "0.25rem 0.5rem", 
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase"
                }}>
                  {report.reason.replace("_", " ")}
                </span>
                <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>Reported By:</strong> {report.reporter.name} ({report.reporter.email})
              </p>
              
              <p style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                <strong>Target:</strong> {report.reported_user ? `User: ${report.reported_user.name} (${report.reported_user.email})` : `Team: ${report.reported_team?.name}`}
              </p>
              
              {report.description && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--color-bg-base)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", borderLeft: "3px solid var(--color-border-hover)" }}>
                  {report.description}
                </div>
              )}
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => handleAction(report.id, "resolved")} 
                disabled={loadingAction === report.id}
                className="btn btn-primary"
                style={{ background: "#10b981", color: "#fff" }}
              >
                Resolve
              </button>
              <button 
                onClick={() => handleAction(report.id, "dismissed")} 
                disabled={loadingAction === report.id}
                className="btn"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
