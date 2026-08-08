"use client";

import { useState, useEffect, useCallback } from "react";

type Proficiency = "beginner" | "intermediate" | "advanced" | "expert";

interface Skill {
  skill: string;
  proficiency: Proficiency;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  gender: string;
  college: string;
  department: string;
  past_hackathons_count: number;
  bio: string | null;
  presentation_skill_rating: number | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_storage_path: string | null;
  contact_visibility: string;
  skills: Skill[];
  led_teams: any[];
}

const PROFICIENCY_COLORS: Record<Proficiency, string> = {
  beginner:     "rgba(148,163,184,0.12)",
  intermediate: "rgba(254,150,119,0.12)",
  advanced:     "rgba(52,211,153,0.12)",
  expert:       "rgba(246,70,104,0.12)",
};
const PROFICIENCY_TEXT: Record<Proficiency, string> = {
  beginner:     "#94a3b8",
  intermediate: "var(--ember-peach)",
  advanced:     "#34d399",
  expert:       "var(--ember-coral)",
};

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [hasSetForm, setHasSetForm] = useState(false);

  // Skills
  const [newSkill, setNewSkill] = useState("");
  const [newProficiency, setNewProficiency] = useState<Proficiency>("intermediate");
  const [skillLoading, setSkillLoading] = useState(false);

  const { data, isLoading: loading, mutate: mutateProfile } = useSWR("/api/users/profile", fetcher, {
    onSuccess: (data) => {
      if (!hasSetForm && data.profile) {
        setForm(data.profile);
        setHasSetForm(true);
      }
    }
  });

  const profile = data?.profile || null;

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);

    if (form.github_url && !form.github_url.match(/^https?:\/\/(www\.)?github\.com\/.+/)) {
      setSaveMsg("Error: Invalid GitHub URL");
      setSaving(false);
      return;
    }
    if (form.linkedin_url && !form.linkedin_url.match(/^https?:\/\/(www\.)?linkedin\.com\/.+/)) {
      setSaveMsg("Error: Invalid LinkedIn URL");
      setSaving(false);
      return;
    }
    if (form.portfolio_url && !/^https?:\/\/\S+$/.test(form.portfolio_url)) {
      setSaveMsg("Error: Invalid Portfolio URL");
      setSaving(false);
      return;
    }
    if (form.whatsapp_number && !form.whatsapp_number.match(/^\+?[1-9]\d{1,14}$/)) {
      setSaveMsg("Error: Invalid WhatsApp number");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, gender: form.gender, bio: form.bio, college: form.college, department: form.department,
        past_hackathons_count: form.past_hackathons_count, presentation_skill_rating: form.presentation_skill_rating,
        phone_number: form.phone_number, whatsapp_number: form.whatsapp_number,
        linkedin_url: form.linkedin_url, github_url: form.github_url, portfolio_url: form.portfolio_url, contact_visibility: form.contact_visibility,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      mutateProfile();
      setForm(data.profile);
      setEditing(false);
      setSaveMsg("Profile saved ✓");
      setTimeout(() => setSaveMsg(null), 3000);
    } else {
      const data = await res.json();
      setSaveMsg("Error: " + (data.error ?? "Save failed"));
    }
    setSaving(false);
  }

  async function handleAddSkill() {
    if (!newSkill.trim()) return;
    setSkillLoading(true);
    const res = await fetch("/api/users/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill: newSkill.trim(), proficiency: newProficiency }),
    });
    if (res.ok) {
      mutateProfile();
      setNewSkill("");
      setNewProficiency("intermediate");
    }
    setSkillLoading(false);
  }

  async function handleRemoveSkill(skill: string) {
    const res = await fetch("/api/users/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    if (res.ok) mutateProfile();
  }

  if (loading) {
    return (
      <div className="page-container" style={{ padding: "3rem 1.25rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[200, 150, 300, 200].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 20, width: w, borderRadius: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 800 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <p className="section-title" style={{ marginBottom: "0.4rem" }}>Profile</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.02em" }}>{profile.name}</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>{profile.email}</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {saveMsg && (
            <span style={{ fontSize: "0.85rem", color: saveMsg.startsWith("Error") ? "#ef4444" : "#10b981", fontWeight: 500 }}>
              {saveMsg}
            </span>
          )}
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm(profile); }} className="btn btn-ghost btn-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          ) : (
            <button id="btn-edit-profile" onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
              ✎ Edit profile
            </button>
          )}
        </div>
      </div>

      {/* ── Basic info ── */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text-secondary)" }}>
          Basic Information
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
          {editing ? (
            <>
              <div>
                <label className="input-label">Full name</label>
                <input className="input-field" value={form.name ?? ""} onChange={(e) => update("name", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Gender</label>
                <input className="input-field" placeholder="e.g. Female, Male" value={form.gender ?? ""} onChange={(e) => update("gender", e.target.value)} />
              </div>
              <div>
                <label className="input-label">College</label>
                <input className="input-field" value={form.college ?? ""} onChange={(e) => update("college", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Department</label>
                <input className="input-field" value={form.department ?? ""} onChange={(e) => update("department", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Past hackathons</label>
                <input type="number" min={0} className="input-field" value={form.past_hackathons_count ?? 0} onChange={(e) => update("past_hackathons_count", parseInt(e.target.value))} />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="College" value={profile.college} />
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Gender" value={profile.gender} />
              <InfoRow label="Past hackathons" value={`${profile.past_hackathons_count} hackathon${profile.past_hackathons_count !== 1 ? "s" : ""}`} />
            </>
          )}
        </div>

        {/* Bio */}
        <div style={{ marginTop: "1.25rem" }}>
          <label className="input-label">Bio</label>
          {editing ? (
            <textarea className="input-field" rows={3} style={{ resize: "vertical" }} value={form.bio ?? ""} onChange={(e) => update("bio", e.target.value)} placeholder="Tell teams a bit about yourself…" />
          ) : (
            <p style={{ color: profile.bio ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              {profile.bio ?? "No bio yet."}
            </p>
          )}
        </div>
      </div>

      {/* ── Presentation skill rating ── */}
      <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", borderRadius: "6px", marginBottom: "1.25rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 900, marginBottom: "0.25rem", color: "#1a1a1a", fontFamily: "var(--font-mono)" }}>
          Presentation / Soft Skill
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#5a5a5a", marginBottom: "1.25rem", fontWeight: 600 }}>
          Self-rated 1–5. Shown to teams reviewing your join request.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (form.presentation_skill_rating ?? profile.presentation_skill_rating ?? 0) >= n;
            return (
              <button
                key={n}
                id={`rating-star-${n}`}
                onClick={() => editing && update("presentation_skill_rating", n)}
                style={{
                  width: 45, height: 45, borderRadius: "4px",
                  border: "2px solid #1a1a1a",
                  background: active ? "#5b5fc7" : "#ffffff",
                  color: active ? "#ffffff" : "#1a1a1a",
                  boxShadow: active ? "2px 2px 0px #1a1a1a" : "2px 2px 0px #1a1a1a",
                  transform: active ? "translate(-2px, -2px)" : "none",
                  fontWeight: 800, fontSize: "1.1rem", cursor: editing ? "pointer" : "default",
                  transition: "all 0.15s ease",
                  fontFamily: "var(--font-mono)"
                }}
              >
                {n}
              </button>
            );
          })}
          <span style={{ marginLeft: "0.5rem", color: "#1a1a1a", fontSize: "0.85rem", fontWeight: 800, fontFamily: "var(--font-mono)", alignSelf: "center", textTransform: "uppercase" }}>
            [ {profile.presentation_skill_rating
              ? ["", "Needs work", "Developing", "Good", "Strong", "Excellent"][profile.presentation_skill_rating]
              : "Not rated yet"} ]
          </span>
        </div>
      </div>

      {/* ── Skills ── */}
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-text-secondary)" }}>
          Skills
        </h2>

        {/* Existing skills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {profile.skills.length === 0 && (
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>No skills added yet.</span>
          )}
          {profile.skills.map((s: Skill) => (
            <div
              key={s.skill}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: PROFICIENCY_COLORS[s.proficiency],
                border: `1px solid ${PROFICIENCY_TEXT[s.proficiency]}30`,
                borderRadius: "var(--radius-sm)", padding: "4px 10px",
                fontFamily: "var(--font-mono)", fontSize: "0.78rem",
              }}
            >
              <span style={{ color: PROFICIENCY_TEXT[s.proficiency], fontWeight: 500 }}>{s.skill}</span>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.7rem" }}>{s.proficiency}</span>
              <button
                onClick={() => handleRemoveSkill(s.skill)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.75rem", padding: 0, lineHeight: 1 }}
                title="Remove skill"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add skill row */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            id="input-new-skill"
            className="input-field"
            style={{ flex: "1 1 160px", maxWidth: 220 }}
            placeholder="e.g. React, Figma, ML…"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
          />
          <select
            id="select-proficiency"
            className="input-field"
            style={{ flex: "0 0 140px", cursor: "pointer" }}
            value={newProficiency}
            onChange={(e) => setNewProficiency(e.target.value as Proficiency)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
          <button
            id="btn-add-skill"
            onClick={handleAddSkill}
            disabled={skillLoading || !newSkill.trim()}
            className="btn btn-primary btn-sm"
            style={{ alignSelf: "flex-start", marginTop: "0.1rem" }}
          >
            {skillLoading ? "…" : "+ Add"}
          </button>
        </div>
      </div>

      {/* ── Contact info ── */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-secondary)" }}>Contact Info</h2>
          {editing && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label className="input-label" style={{ margin: 0 }}>Visibility:</label>
              <select className="input-field" style={{ width: "auto", cursor: "pointer", padding: "0.3rem 0.6rem", fontSize: "0.8rem" }} value={form.contact_visibility ?? "private"} onChange={(e) => update("contact_visibility", e.target.value)}>
                <option value="private">Private</option>
                <option value="team_only">Team members only</option>
                <option value="public_to_logged_in">All logged-in users</option>
              </select>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {editing ? (
            <>
              <div>
                <label className="input-label">Phone / WhatsApp</label>
                <input className="input-field" placeholder="+91 XXXXX XXXXX" value={form.phone_number ?? ""} onChange={(e) => update("phone_number", e.target.value)} />
              </div>
              <div>
                <label className="input-label">LinkedIn URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input-field" placeholder="https://linkedin.com/in/…" value={form.linkedin_url ?? ""} onChange={(e) => update("linkedin_url", e.target.value)} />
              </div>
              <div>
                <label className="input-label">GitHub URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input-field" placeholder="https://github.com/…" value={form.github_url ?? ""} onChange={(e) => update("github_url", e.target.value)} />
              </div>
              <div>
                <label className="input-label">Portfolio URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <input className="input-field" placeholder="https://yourportfolio.dev/…" value={form.portfolio_url ?? ""} onChange={(e) => update("portfolio_url", e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Phone" value={profile.phone_number ?? <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="LinkedIn" value={profile.linkedin_url ? <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ember-peach)" }}>View profile</a> : <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="GitHub" value={profile.github_url ? <a href={profile.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ember-peach)" }}>View profile</a> : <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="Portfolio" value={profile.portfolio_url ? <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ember-peach)" }}>View portfolio</a> : <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="Visibility" value={
                ({ private: "🔒 Private", team_only: "👥 Team members only", public_to_logged_in: "🌐 All logged-in users" } as any)[profile.contact_visibility] ?? profile.contact_visibility
              } />
            </>
          )}
        </div>
        {!editing && profile.contact_visibility === "private" && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            💡 Your contact info is private. Edit your profile to make it visible to teammates after matching.
          </p>
        )}
      </div>

      {/* Resume Upload Section (Leader Only) */}
      {profile.led_teams.length > 0 && (
        <div className="card" style={{ padding: "1.5rem", border: "1.5px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a", borderRadius: "4px", background: "#fdfbfa", marginTop: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a1a", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            Leader Resume
          </h3>
          <p style={{ fontSize: "0.85rem", color: "#4a4a4a", marginBottom: "1rem" }}>
            Upload your resume so applicants can verify your skills and background. (PDF only, max 5MB)
          </p>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  alert("File is too large (max 5MB).");
                  return;
                }
                const formData = new FormData();
                formData.append("resume", file);
                const res = await fetch("/api/users/resume", {
                  method: "POST",
                  body: formData
                });
                if (res.ok) {
                  alert("Resume uploaded successfully!");
                  window.location.reload();
                } else {
                  const data = await res.json();
                  alert(data.error || "Upload failed");
                }
              }} 
              style={{ fontSize: "0.85rem" }}
            />
            {profile.resume_storage_path && (
              <a 
                href={`/api/users/resume?path=${encodeURIComponent(profile.resume_storage_path)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.5rem 1rem",
                  background: "#1a1a1a",
                  color: "#ffffff",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  borderRadius: "3px",
                  boxShadow: "2px 2px 0px #5b5fc7"
                }}
              >
                View Current Resume
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.2rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: "0.9rem", color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
