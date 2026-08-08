"use client";

import { useState } from "react";
import { SkillSelector } from "@/components/SkillSelector";
import { SIH_THEMES } from "@/lib/constants";

interface Slot {
  id: string;
  role_title: string | null;
  gender: string;
  skills: string[];
  is_filled: boolean;
}

interface TeamSpecEditorProps {
  team: {
    id: string;
    name: string;
    description: string | null;
    domain_interest: string | null;
    slots: Slot[];
    event?: { team_size_max?: number };
  };
  onSaved: () => void;
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

export function TeamSpecEditor({ team, onSaved, onClose }: TeamSpecEditorProps) {
  const [name, setName] = useState(team.name);
  const [domain, setDomain] = useState(team.domain_interest || "");
  const [description, setDescription] = useState(team.description || "");
  const [openSlots, setOpenSlots] = useState<{ id?: string; role_title: string; gender: string; skills: string[] }[]>(
    team.slots.filter((s) => !s.is_filled).map((s) => ({ id: s.id, role_title: s.role_title || "", gender: s.gender, skills: s.skills }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamSizeMax = team.event?.team_size_max ?? 6;
  const filledCount = team.slots.filter((s) => s.is_filled).length;
  const maxOpenSlots = Math.max(0, teamSizeMax - filledCount);
  const squadSize = filledCount + openSlots.length;

  function addSlot() {
    if (openSlots.length >= maxOpenSlots) return;
    setOpenSlots([...openSlots, { role_title: "", gender: "any", skills: [] }]);
  }

  function removeSlot(index: number) {
    setOpenSlots(openSlots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, updates: Partial<{ role_title: string; gender: string; skills: string[] }>) {
    setOpenSlots((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    if (!name.trim()) {
      setError("Team name is required.");
      setSaving(false);
      return;
    }
    if (!description.trim()) {
      setError("Mission objective is required.");
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        domain_interest: domain,
        description,
        slots: openSlots.map((s) => ({ id: s.id, role_title: s.role_title, gender: s.gender, skills: s.skills })),
      }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update team.");
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", borderRadius: "6px", padding: "2rem", marginTop: "2rem", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.4rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
            [TEAM CONFIG EDITOR]
          </div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", margin: 0 }}>Edit Team Specifications</h3>
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
            Team Name <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cybernauts / Code Blooded" style={fieldStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Hackathon Domain
          </label>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} style={{ ...fieldStyle, cursor: "pointer" }}>
            <option value="">Select an SIH theme / sector…</option>
            {SIH_THEMES.map((theme) => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
            Mission Objective <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What problem statement are you tackling? What is the technical vibe of your team?"
            rows={4}
            style={{ ...fieldStyle, fontWeight: 500, minHeight: "auto", resize: "vertical" }}
          />
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--font-mono)", textTransform: "uppercase", margin: 0 }}>
              Member Slots
            </label>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", background: "#eef0ff", border: "2px solid #5b5fc7", padding: "0.25rem 0.6rem", borderRadius: "3px", color: "#5b5fc7", boxShadow: "2px 2px 0px #1a1a1a" }}>
              SQUAD SIZE: {squadSize} / {teamSizeMax}
            </div>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#4a4a4a", marginBottom: "0.75rem", fontWeight: 500 }}>
            Edit or remove open positions. Slots already filled by current members are locked and shown below.
          </p>

          {openSlots.length === 0 && (
            <div style={{ fontSize: "0.85rem", color: "#6b7280", fontStyle: "italic", marginBottom: "0.75rem" }}>
              No open member slots. You can add a slot to advertise a role you need.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
            {openSlots.map((slot, i) => (
              <div key={i} style={{ background: "#f8f6f0", border: "2px solid #1a1a1a", borderRadius: "4px", padding: "1rem", position: "relative" }}>
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}
                  title="Remove slot"
                >
                  ✕
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Role Title</label>
                    <input placeholder="e.g. Frontend Dev" value={slot.role_title} onChange={(e) => updateSlot(i, { role_title: e.target.value })} style={{ ...fieldStyle, padding: "0.4rem 0.6rem", minHeight: "36px" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Gender Req</label>
                    <select value={slot.gender} onChange={(e) => updateSlot(i, { gender: e.target.value })} style={{ ...fieldStyle, padding: "0.4rem 0.6rem", minHeight: "36px" }}>
                      <option value="any">Any</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Required Skills</label>
                  <SkillSelector selectedSkills={slot.skills} onChange={(skills) => updateSlot(i, { skills })} />
                </div>
              </div>
            ))}
          </div>

          {openSlots.length < maxOpenSlots && (
            <button
              type="button"
              onClick={addSlot}
              style={{ padding: "0.65rem 1.25rem", background: "#ffffff", color: "#1a1a1a", border: "2px dashed #1a1a1a", borderRadius: "4px", fontWeight: 800, cursor: "pointer", width: "100%" }}
            >
              + Add Member Slot
            </button>
          )}
          {openSlots.length >= maxOpenSlots && filledCount > 0 && (
            <div style={{ fontSize: "0.78rem", color: "#6b7280", fontStyle: "italic", fontWeight: 600 }}>
              Squad capacity reached ({teamSizeMax}). Remove a slot or member to make room.
            </div>
          )}
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
            {saving ? "Saving..." : "💾 Save Team Specs"}
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
