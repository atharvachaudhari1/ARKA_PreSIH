"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SIH_THEMES } from "@/lib/constants";

export default function CreateTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    domain_interest: "",
    min_experience_required: "0",
    succession_mode: "manual",
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.name.trim()) {
      setError("Team name is required.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        skills_needed: skills,
      }),
    });

    if (res.ok) {
      router.push(`/dashboard`); // Go back to dashboard after creating
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create team.");
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 600 }}>
      <div style={{ marginBottom: "2rem" }}>
        <p className="section-title" style={{ marginBottom: "0.4rem" }}>$ mkdir team</p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Create a Team</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
          You will automatically be assigned as the team leader.
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label htmlFor="team-name" className="input-label">Team Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input id="team-name" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Code Blooded" className="input-field" />
          </div>

          <div>
            <label htmlFor="team-domain" className="input-label">Domain Interest</label>
            <select id="team-domain" value={form.domain_interest} onChange={(e) => update("domain_interest", e.target.value)} className="input-field" style={{ cursor: "pointer" }}>
              <option value="">Select a theme…</option>
              {SIH_THEMES.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-desc" className="input-label">Description <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
            <textarea id="team-desc" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What are you building? What's your team's vibe?" className="input-field" rows={3} style={{ resize: "vertical" }} />
          </div>

          <div>
            <label htmlFor="team-exp" className="input-label">Minimum Hackathons Experience Required</label>
            <input id="team-exp" type="number" min="0" value={form.min_experience_required} onChange={(e) => update("min_experience_required", e.target.value)} className="input-field" />
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
              Filter out applicants who have less than this many past hackathons.
            </p>
          </div>

          <div>
            <label className="input-label">Skills Needed</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
              {skills.map((s) => (
                <div
                  key={s}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    background: "rgba(99,102,241,0.15)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "var(--radius-sm)", padding: "4px 10px",
                    fontFamily: "var(--font-mono)", fontSize: "0.78rem",
                    color: "var(--color-brand-light)", fontWeight: 500
                  }}
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.75rem", padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="input-field"
                placeholder="e.g. React, UX Design"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button type="button" onClick={handleAddSkill} disabled={!newSkill.trim()} className="btn btn-secondary btn-sm" style={{ padding: "0 1rem" }}>
                Add
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
              {loading ? "Creating…" : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
