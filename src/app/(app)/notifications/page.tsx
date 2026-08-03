import { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ tail -f notifications.log</p>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Notifications</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>Real-time notifications — coming in Phase 4.</p>
    </div>
  );
}
