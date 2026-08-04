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
      router.push(`/dashboard`);
      router.refresh();
    } else {
      let errorMessage = "Failed to create team.";
      try {
        const data = await res.json();
        if (data.error) errorMessage = data.error;
      } catch (err) {
        // Fallback for body-less 500 errors
      }
      setError(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="page-container" style={{ padding: "2.5rem 1.25rem", maxWidth: "680px", margin: "0 auto", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "2rem" }}>
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
          $ MKDIR ./NEW_TEAM --INIT
        </div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
          Deploy a New Squad
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
          Initialize your team profile. You will automatically be assigned as the executive squad leader.
        </p>
      </div>

      <div 
        style={{ 
          background: "#ffffff", 
          border: "2px solid #1a1a1a", 
          boxShadow: "5px 5px 0px #1a1a1a", 
          borderRadius: "6px", 
          padding: "2rem",
          boxSizing: "border-box"
        }}
        className="card"
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label htmlFor="team-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Squad Designation <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input 
              id="team-name" 
              required 
              value={form.name} 
              onChange={(e) => update("name", e.target.value)} 
              placeholder="e.g. Cybernauts / Code Blooded" 
              style={{ border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.65rem 0.85rem", background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.95rem", width: "100%", boxSizing: "border-box", minHeight: "44px" }} 
            />
          </div>

          <div>
            <label htmlFor="team-domain" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Target Hackathon Domain
            </label>
            <select 
              id="team-domain" 
              value={form.domain_interest} 
              onChange={(e) => update("domain_interest", e.target.value)} 
              style={{ border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.65rem 0.85rem", background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.95rem", width: "100%", boxSizing: "border-box", cursor: "pointer", minHeight: "44px" }}
            >
              <option value="">Select an SIH theme / sector…</option>
              {SIH_THEMES.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="team-desc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Mission Objective <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
            </label>
            <textarea 
              id="team-desc" 
              value={form.description} 
              onChange={(e) => update("description", e.target.value)} 
              placeholder="What problem statement are you tackling? What is the technical vibe of your team?" 
              rows={4} 
              style={{ border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.65rem 0.85rem", background: "#fdfbfa", color: "#1a1a1a", fontWeight: 500, fontSize: "0.95rem", width: "100%", boxSizing: "border-box", resize: "vertical" }} 
            />
          </div>

          <div>
            <label htmlFor="team-exp" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Minimum Hackathons Experience Filter
            </label>
            <input 
              id="team-exp" 
              type="number" 
              min="0" 
              value={form.min_experience_required} 
              onChange={(e) => update("min_experience_required", e.target.value)} 
              style={{ border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.65rem 0.85rem", background: "#fdfbfa", color: "#1a1a1a", fontWeight: 700, fontSize: "0.95rem", width: "100%", boxSizing: "border-box", minHeight: "44px" }} 
            />
            <p style={{ fontSize: "0.78rem", color: "#666", marginTop: "0.35rem", fontWeight: 600 }}>
              💡 Only applicants matching or exceeding this hackathon count will appear in priority filtering.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Required Technologies & Skill Gaps
            </label>
            {skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                {skills.map((s) => (
                  <div
                    key={s}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      background: "#eef0ff",
                      border: "1.5px solid #5b5fc7",
                      boxShadow: "1.5px 1.5px 0px #1a1a1a",
                      borderRadius: "3px", padding: "4px 10px",
                      fontFamily: "var(--font-mono)", fontSize: "0.8rem",
                      color: "#1a1a1a", fontWeight: 700
                    }}
                  >
                    ⚡ {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1rem", fontWeight: 900, padding: 0, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="responsive-stack" style={{ display: "flex", gap: "0.75rem" }}>
              <input
                style={{ flex: 1, border: "2px solid #1a1a1a", borderRadius: "4px", padding: "0.65rem 0.85rem", background: "#fdfbfa", color: "#1a1a1a", fontWeight: 600, fontSize: "0.95rem", boxSizing: "border-box", minHeight: "44px" }}
                placeholder="e.g. React, Next.js, AI/ML, Figma"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button 
                type="button" 
                onClick={handleAddSkill} 
                disabled={!newSkill.trim()} 
                className="btn-mobile-full"
                style={{ 
                  padding: "0.65rem 1.25rem", 
                  background: "#f8f6f0", 
                  color: "#1a1a1a", 
                  border: "2px solid #1a1a1a", 
                  boxShadow: "2.5px 2.5px 0px #1a1a1a", 
                  borderRadius: "4px", 
                  fontWeight: 800, 
                  fontFamily: "var(--font-mono)", 
                  cursor: "pointer",
                  minHeight: "44px"
                }}
              >
                + Add Skill
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "4px", padding: "0.85rem", color: "#dc2626", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>
              ⚠️ [ERROR]: {error}
            </div>
          )}

          <div style={{ marginTop: "1rem" }}>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                width: "100%", 
                padding: "0.95rem",
                background: "#5b5fc7", 
                color: "#ffffff", 
                border: "2px solid #1a1a1a", 
                boxShadow: "4px 4px 0px #1a1a1a",
                borderRadius: "4px", 
                fontWeight: 800, 
                fontSize: "1.05rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: "pointer",
                minHeight: "48px"
              }}
            >
              {loading ? "Deploying Squad Profile…" : "🚀 Confirm & Deploy Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
