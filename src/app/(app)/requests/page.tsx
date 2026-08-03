import { Metadata } from "next";

export const metadata: Metadata = { title: "My Requests" };

export default function RequestsPage() {
  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ cat requests.log</p>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>My Requests</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>Join request tracking — coming in Phase 3.</p>
    </div>
  );
}
