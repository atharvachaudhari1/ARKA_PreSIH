import { Metadata } from "next";

export const metadata: Metadata = { title: "Browse Teams" };

export default function TeamsPage() {
  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ ls ~/teams</p>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Browse Teams</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>Team cards, filters, and browse — coming in Phase 2.</p>
    </div>
  );
}
