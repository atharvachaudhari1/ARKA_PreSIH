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
  verification_status: "pending" | "verified" | "rejected";
  past_hackathons_count: number;
  bio: string | null;
  presentation_skill_rating: number | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  linkedin_url: string | null;
  contact_visibility: string;
  skills: Skill[];
}

const PROFICIENCY_COLORS: Record<Proficiency, string> = {
  beginner: "rgba(148,163,184,0.15)",
  intermediate: "rgba(99,102,241,0.15)",
  advanced: "rgba(16,185,129,0.15)",
  expert: "rgba(245,158,11,0.15)",
};
const PROFICIENCY_TEXT: Record<Proficiency, string> = {
  beginner: "#94a3b8",
  intermediate: "#818cf8",
  advanced: "#10b981",
  expert: "#f59e0b",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});

  // Skills
  const [newSkill, setNewSkill] = useState("");
  const [newProficiency, setNewProficiency] = useState<Proficiency>("intermediate");
  const [skillLoading, setSkillLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setForm(data.profile);
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line
  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, gender: form.gender, bio: form.bio, college: form.college, department: form.department,
        past_hackathons_count: form.past_hackathons_count, presentation_skill_rating: form.presentation_skill_rating,
        phone_number: form.phone_number, whatsapp_number: form.whatsapp_number,
        linkedin_url: form.linkedin_url, contact_visibility: form.contact_visibility,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
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
      await fetchProfile();
      setNewSkill("");
      setNewProficiency("intermediate");
    }
    setSkillLoading(false);
  }

  async function handleRemoveSkill(skill: string) {
    await fetch("/api/users/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill }),
    });
    await fetchProfile();
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

  const verificationColor = profile.verification_status === "verified" ? "#10b981"
    : profile.verification_status === "rejected" ? "#ef4444" : "#f59e0b";
  const verificationLabel = profile.verification_status === "verified" ? "✓ Verified"
    : profile.verification_status === "rejected" ? "✗ Rejected" : "⏳ Pending";

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 800 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <p className="section-title" style={{ marginBottom: "0.4rem" }}>$ cat profile.md</p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>{profile.name}</h1>
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

      {/* ── Verification banner ── */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: "1rem",
          background: profile.verification_status === "verified" ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
          border: `1px solid ${verificationColor}30`,
          borderRadius: "var(--radius-md)", padding: "0.85rem 1.25rem", marginBottom: "1.5rem",
        }}
      >
        <span style={{ color: verificationColor, fontWeight: 700, fontSize: "0.875rem" }}>{verificationLabel}</span>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
          {profile.verification_status === "verified"
            ? "Your college ID has been verified. Your department is shown as verified on team cards."
            : profile.verification_status === "rejected"
            ? "Your ID card was rejected. Please contact support to re-submit."
            : "Your college ID is being verified. Department shown with 'Unverified' badge until confirmed."}
        </span>
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
              <InfoRow
                label="Department"
                value={
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {profile.department}
                    {/* [GAP-RESOLVED-7] Show Unverified badge if not verified */}
                    {profile.verification_status !== "verified" && (
                      <span className="badge badge-unverified">Unverified</span>
                    )}
                  </span>
                }
              />
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
      <div className="card" style={{ marginBottom: "1.25rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-secondary)" }}>
          Presentation / Soft Skill
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
          Self-rated 1–5. Shown to teams reviewing your join request.
        </p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = (form.presentation_skill_rating ?? profile.presentation_skill_rating ?? 0) >= n;
            return (
              <button
                key={n}
                id={`rating-star-${n}`}
                onClick={() => editing && update("presentation_skill_rating", n)}
                style={{
                  width: 40, height: 40, borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--color-brand)" : "var(--color-border)"}`,
                  background: active ? "rgba(99,102,241,0.15)" : "var(--color-bg-elevated)",
                  color: active ? "var(--color-brand-light)" : "var(--color-text-muted)",
                  fontWeight: 700, fontSize: "1rem", cursor: editing ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
              >
                {n}
              </button>
            );
          })}
          <span style={{ marginLeft: "0.5rem", color: "var(--color-text-muted)", fontSize: "0.8rem", alignSelf: "center" }}>
            {profile.presentation_skill_rating
              ? ["", "Needs work", "Developing", "Good", "Strong", "Excellent"][profile.presentation_skill_rating]
              : "Not rated yet"}
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
          {profile.skills.map((s) => (
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
                <label className="input-label">LinkedIn URL</label>
                <input className="input-field" placeholder="https://linkedin.com/in/…" value={form.linkedin_url ?? ""} onChange={(e) => update("linkedin_url", e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <InfoRow label="Phone" value={profile.phone_number ?? <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="LinkedIn" value={profile.linkedin_url ? <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-brand-light)" }}>View profile</a> : <span style={{ color: "var(--color-text-muted)" }}>Not set</span>} />
              <InfoRow label="Visibility" value={
                { private: "🔒 Private", team_only: "👥 Team members only", public_to_logged_in: "🌐 All logged-in users" }[profile.contact_visibility] ?? profile.contact_visibility
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
