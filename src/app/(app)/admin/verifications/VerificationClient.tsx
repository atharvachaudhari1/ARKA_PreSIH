"use client";

import { useState } from "react";
import EmptyState from "@/components/EmptyState";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  college: string | null;
  department: string | null;
  created_at: Date;
  ocr_confidence_score: number | null;
};

export default function VerificationClient({ initialUsers }: { initialUsers: PendingUser[] }) {
  const [users, setUsers] = useState<PendingUser[]>(initialUsers);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [viewingIdUrl, setViewingIdUrl] = useState<string | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  async function handleViewId(userId: string) {
    if (viewingUserId === userId && viewingIdUrl) {
      setViewingUserId(null);
      setViewingIdUrl(null);
      return;
    }
    
    setImgLoading(true);
    setViewingUserId(userId);
    
    try {
      const res = await fetch(`/api/admin/verifications/${userId}/id-card`);
      if (res.ok) {
        const data = await res.json();
        setViewingIdUrl(data.signedUrl);
      } else {
        alert("Failed to load ID card");
        setViewingUserId(null);
      }
    } catch (e) {
      alert("Error fetching ID card");
      setViewingUserId(null);
    }
    setImgLoading(false);
  }

  async function handleAction(userId: string, action: "verified" | "rejected") {
    setLoadingAction(userId);
    try {
      const res = await fetch(`/api/admin/verifications/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
        if (viewingUserId === userId) {
          setViewingUserId(null);
          setViewingIdUrl(null);
        }
      } else {
        alert("Failed to update verification status");
      }
    } catch (e) {
      alert("Error updating status");
    }
    setLoadingAction(null);
  }

  if (users.length === 0) {
    return (
      <EmptyState 
        title="Queue Empty" 
        description="There are no pending ID verifications." 
        icon="✅" 
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {users.map(user => (
        <div key={user.id} className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>{user.name}</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>{user.email}</p>
              <div style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                <p><strong>College:</strong> {user.college || "N/A"}</p>
                <p><strong>Department:</strong> {user.department || "N/A"}</p>
                <p><strong>OCR Confidence:</strong> {user.ocr_confidence_score ? (user.ocr_confidence_score * 100).toFixed(1) + "%" : "N/A"}</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => handleViewId(user.id)} 
                className="btn"
                style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}
              >
                {viewingUserId === user.id ? "Hide ID" : "View ID"}
              </button>
              <button 
                onClick={() => handleAction(user.id, "verified")} 
                disabled={loadingAction === user.id}
                className="btn btn-primary"
                style={{ background: "#10b981", color: "#fff" }}
              >
                Approve
              </button>
              <button 
                onClick={() => handleAction(user.id, "rejected")} 
                disabled={loadingAction === user.id}
                className="btn btn-primary"
                style={{ background: "#ef4444", color: "#fff" }}
              >
                Reject
              </button>
            </div>
          </div>
          
          {viewingUserId === user.id && (
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)", textAlign: "center" }}>
              {imgLoading ? (
                <p>Loading image...</p>
              ) : viewingIdUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={viewingIdUrl} alt="ID Card" style={{ maxWidth: "100%", maxHeight: "500px", borderRadius: "var(--radius-md)" }} />
              ) : (
                <p style={{ color: "var(--color-ember-coral)" }}>Image not available</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
