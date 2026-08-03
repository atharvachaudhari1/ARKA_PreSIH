import { Metadata } from "next";

export const metadata: Metadata = { title: "Create Team" };

export default function CreateTeamPage() {
  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem" }}>
      <p className="section-title" style={{ marginBottom: "0.5rem" }}>$ mkdir ~/teams/new</p>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>Create a Team</h1>
      <p style={{ color: "var(--color-text-secondary)" }}>Team creation form — coming in Phase 2.</p>
    </div>
  );
}
