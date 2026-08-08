"use client";

import { useState } from "react";
import { SkillSelector } from "@/components/SkillSelector";

interface ProfileInlineEditorProps {
  profile: {
    id?: string;
    bio?: string | null;
    linkedin_url?: string | null;
    github_url?: string | null;
    portfolio_url?: string | null;
    skills?: { skill: string }[];
  };
  onSaved: (profile: any) => void;
  onClose: () => void;
}

const fieldStyle: React.CSSProperties = {
  border: "2px solid #1a1a1a",
  borderRadius: "4px",
  padding: "0.65rem 0.85rem",
  background: "#fdfbfa",
  color: "#1a1a1a",
  fontWeight: 700,
  fontSize: "0.95rem",
  width: "100%",
  boxSizing: "border-box",
  minHeight: "44px",
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

export function ProfileInlineEditor({ profile, onSaved, onClose }: ProfileInlineEditorProps) {
  const [bio, setBio] = useState(profile?.bio || "");
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url || "");
  const [github, setGithub] = useState(profile?.github_url || "");
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url || "");
  const [skills, setSkills] = useState<string[]>(profile?.skills?.map((s) => s.skill) || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (portfolio && !/^https?:\/\/\S+$/.test(portfolio)) {
      setError("Please provide a valid Portfolio URL (e.g. https://yourportfolio.dev).");
      setSaving(false);
      return;
    }
    if (linkedin && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(linkedin)) {
      setError("Please provide a valid LinkedIn URL (e.g. https://linkedin.com/in/username).");
      setSaving(false);
      return;
    }
    if (github && !/^https?:\/\/(www\.)?github\.com\/.+/.test(github)) {
      setError("Please provide a valid GitHub URL (e.g. https://github.com/username).");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bio,
        linkedin_url: linkedin,
        github_url: github,
        portfolio_url: portfolio,
        skills,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      onSaved(data.profile);
      onClose();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save profile.");
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", borderRadius: "6px", padding: "2rem", marginTop: "2rem", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.4rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
            [PROFILE MAINTENANCE]
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Edit My Profile</h3>
        </div>
        <button
          onClick={onClose}
          style={{ padding: "0.5rem 0.9rem", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-mono)" }}
        >
          ✕ Cancel
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Your Bio / Description
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell teams a bit about yourself..."
            rows={3}
            style={{ ...fieldStyle, fontWeight: 500, minHeight: "auto", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              LinkedIn URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
            </label>
            <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" style={fieldStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              GitHub URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
            </label>
            <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/username" style={fieldStyle} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Portfolio Website URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
          </label>
          <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://yourportfolio.dev/" style={fieldStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Your Skills
          </label>
          <SkillSelector selectedSkills={skills} onChange={setSkills} />
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "4px", padding: "0.85rem", color: "#dc2626", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>
            ⚠️ [ERROR]: {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "0.8rem 1.75rem",
              background: saving ? "#8890d4" : "#5b5fc7",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              cursor: saving ? "not-allowed" : "pointer",
              minHeight: "44px",
            }}
          >
            {saving ? "Saving..." : "💾 Save Profile"}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "0.8rem 1.5rem",
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
