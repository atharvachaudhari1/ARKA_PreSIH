import { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
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
        $ TAIL -F ./NOTIFICATIONS.LOG
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Notifications</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>Real-time notifications — coming in Phase 4.</p>
    </div>
  );
}
