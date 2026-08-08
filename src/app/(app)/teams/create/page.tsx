"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkillSelector } from "@/components/SkillSelector";
import { UserSearchAutocomplete } from "@/components/UserSearchAutocomplete";
import { SIH_THEMES } from "@/lib/constants";

// Shared hover handlers for form fields

const COMMON_SKILLS = [
  "React", "Next.js", "Node.js", "Python", "Django", "FastAPI", "AI/ML", 
  "Figma", "UI/UX", "TypeScript", "JavaScript", "PostgreSQL", "MongoDB", 
  "Docker", "AWS", "Firebase", "Tailwind CSS", "Go", "Rust", "C++", "Java"
];

function IconZap() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", marginRight: "4px" }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IconRocket() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "text-bottom", marginRight: "6px" }}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5a2.5 2.5 0 0 0 3.4-3.4zM22 2l-7 7M22 2l-3.5 3.5"/>
      <path d="M12 9.5a2.5 2.5 0 0 0-3.4 3.4l-.5.5M22 2A15 15 0 0 0 10.5 7L5 12.5"/>
    </svg>
  );
}

const fieldHover = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = "#5b5fc7";
    (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #5b5fc7";
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a";
    (e.currentTarget as HTMLElement).style.boxShadow = "none";
  },
  onMouseOver: (e: React.MouseEvent<HTMLElement>) => {
    if (document.activeElement !== e.currentTarget) {
      (e.currentTarget as HTMLElement).style.borderColor = "#5b5fc7";
      (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 0px #5b5fc7";
    }
  },
  onMouseOut: (e: React.MouseEvent<HTMLElement>) => {
    if (document.activeElement !== e.currentTarget) {
      (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a";
      (e.currentTarget as HTMLElement).style.boxShadow = "none";
    }
  },
};

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

function CreateTeamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    domain_interest: "",
    succession_mode: "manual",
    leaderBio: "",
    portfolioUrl: "",
    linkedinUrl: "",
    githubUrl: "",
  });

  const [leaderSkills, setLeaderSkills] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [hasExistingResume, setHasExistingResume] = useState(false);


  useEffect(() => {
    fetch("/api/users/profile").then(r => r.json()).then(data => {
      if (data.profile?.resume_storage_path) {
        setHasExistingResume(true);
      }
    });
  }, []);

  const [slots, setSlots] = useState<{ role_title: string; gender: string; skills: string[]; prefill_user_id?: string; prefill_user_name?: string }[]>([]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addSlot() {
    setSlots([...slots, { role_title: "", gender: "any", skills: [] }]);
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index));
  }

  function updateSlot(index: number, updates: Partial<{ role_title: string; gender: string; skills: string[]; prefill_user_id?: string; prefill_user_name?: string }>) {
    setSlots(prev => {
      const newSlots = [...prev];
      newSlots[index] = { ...newSlots[index], ...updates };
      return newSlots;
    });
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

    if (form.portfolioUrl && !/^https?:\/\/\S+$/.test(form.portfolioUrl)) {
      setError("Please provide a valid Portfolio URL (e.g. https://yourportfolio.dev).");
      setLoading(false);
      return;
    }
    if (form.linkedinUrl && !/^https?:\/\/(www\.)?linkedin\.com\/.+/.test(form.linkedinUrl)) {
      setError("Please provide a valid LinkedIn URL (e.g. https://linkedin.com/in/username).");
      setLoading(false);
      return;
    }
    if (form.githubUrl && !/^https?:\/\/(www\.)?github\.com\/.+/.test(form.githubUrl)) {
      setError("Please provide a valid GitHub URL (e.g. https://github.com/username).");
      setLoading(false);
      return;
    }

    if (resumeFile) {
      const formData = new FormData();
      formData.append("resume", resumeFile);
      const rRes = await fetch("/api/users/resume", { method: "POST", body: formData });
      if (!rRes.ok) {
        const errData = await rRes.json().catch(() => ({}));
        setError("Failed to upload resume: " + (errData.error || "Unknown error"));
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        leaderSkills,
        skills_needed: Array.from(new Set(slots.flatMap(s => s.skills))),
        slots,
        event_id: eventId,
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
      } catch {
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
          Deploy a New Team
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.95rem", fontWeight: 500, margin: 0 }}>
          Initialize your team profile. You will automatically be assigned as the team leader.
        </p>
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          boxShadow: "5px 5px 0px #1a1a1a",
          borderRadius: "6px",
          padding: "2rem",
          marginBottom: "2rem",
          boxSizing: "border-box"
        }}
        className="card"
      >
        <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "0.5rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
          [YOUR LEADER PROFILE]
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label htmlFor="leader-bio" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Your Bio / Description <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
            </label>
            <textarea
              id="leader-bio"
              value={form.leaderBio}
              onChange={(e) => update("leaderBio", e.target.value)}
              placeholder="A brief intro about yourself..."
              rows={3}
              style={{ ...fieldStyle, fontWeight: 500, minHeight: "auto", resize: "vertical" }}
              {...fieldHover}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label htmlFor="leader-linkedin" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                LinkedIn URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
              </label>
              <input
                id="leader-linkedin"
                type="url"
                value={form.linkedinUrl}
                onChange={(e) => update("linkedinUrl", e.target.value)}
                placeholder="https://linkedin.com/in/username"
                style={fieldStyle}
                {...fieldHover}
              />
            </div>
            <div>
              <label htmlFor="leader-github" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                GitHub URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
              </label>
              <input
                id="leader-github"
                type="url"
                value={form.githubUrl}
                onChange={(e) => update("githubUrl", e.target.value)}
                placeholder="https://github.com/username"
                style={fieldStyle}
                {...fieldHover}
              />
            </div>
          </div>
          <div>
            <label htmlFor="leader-portfolio" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Portfolio Website URL <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
            </label>
            <input
              id="leader-portfolio"
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => update("portfolioUrl", e.target.value)}
              placeholder="https://yourportfolio.dev/"
              style={fieldStyle}
              {...fieldHover}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Your Skills
            </label>
            <SkillSelector selectedSkills={leaderSkills} onChange={setLeaderSkills} />
          </div>

          {!hasExistingResume && (
            <div style={{ background: "#f8f6f0", border: "2px dashed #1a1a1a", padding: "1.25rem", borderRadius: "4px" }}>
              <label htmlFor="leader-resume" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                Resume <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
              </label>
              <p style={{ fontSize: "0.8rem", color: "#4a4a4a", marginBottom: "0.75rem", fontWeight: 500 }}>
                Add a resume so applicants can evaluate your leadership recommended!
              </p>
              <input
                id="leader-resume"
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) {
                    setResumeFile(null);
                    setResumeError(null);
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    setResumeError("Resume file is too large (max 2MB). Please upload a smaller PDF.");
                    setResumeFile(null);
                    e.target.value = "";
                    return;
                  }
                  setResumeError(null);
                  setResumeFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById("leader-resume")?.click()}
                style={{ padding: "0.6rem 1rem", background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-mono)" }}
              >
                {resumeFile ? `📄 ${resumeFile.name} (Change)` : "📄 Upload PDF"}
              </button>
              {resumeError && (
                <div style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 700, marginTop: "0.5rem" }}>
                  ⚠️ {resumeError}
                </div>
              )}
            </div>
          )}
          {hasExistingResume && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "0.75rem 1rem", borderRadius: "4px", color: "#10b981", fontSize: "0.85rem", fontWeight: 600 }}>
              ✅ You already have a resume attached to your profile.
            </div>
          )}
        </div>
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
        <div style={{ fontSize: "0.72rem", color: "#1a1a1a", marginBottom: "1rem", textTransform: "uppercase", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "1px" }}>
          [TEAM SPECIFICATIONS]
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Team Name */}
          <div>
            <label htmlFor="team-name" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Team Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="team-name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Cybernauts / Code Blooded"
              style={fieldStyle}
              {...fieldHover}
            />
          </div>

          {/* Hackathon Domain */}
          <div>
            <label htmlFor="team-domain" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Hackathon Domain
            </label>
            <select
              id="team-domain"
              value={form.domain_interest}
              onChange={(e) => update("domain_interest", e.target.value)}
              style={{ ...fieldStyle, cursor: "pointer" }}
              {...fieldHover}
            >
              <option value="">Select an SIH theme / sector…</option>
              {SIH_THEMES.map(theme => (
                <option key={theme} value={theme}>{theme}</option>
              ))}
            </select>
          </div>

          {/* Mission Objective */}
          <div>
            <label htmlFor="team-desc" style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Mission Objective <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              id="team-desc"
              required
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What problem statement are you tackling? What is the technical vibe of your team?"
              rows={4}
              style={{ ...fieldStyle, fontWeight: 500, minHeight: "auto", resize: "vertical" }}
              {...fieldHover}
            />
          </div>


          {/* Member Slots */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "var(--font-mono)", textTransform: "uppercase", margin: 0 }}>
                Member Slots <span style={{ color: "#777", fontWeight: 600 }}>(Optional)</span>
              </label>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", background: "#eef0ff", border: "2px solid #5b5fc7", padding: "0.25rem 0.6rem", borderRadius: "3px", color: "#5b5fc7", boxShadow: "2px 2px 0px #1a1a1a" }}>
                SQUAD SIZE: {1 + slots.length} / 6
              </div>
            </div>
            <div style={{ background: "#eef0ff", border: "1.5px solid #5b5fc7", borderRadius: "4px", padding: "0.65rem 0.85rem", marginBottom: "1rem", color: "#5b5fc7", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <span style={{ fontSize: "1rem", lineHeight: 1 }}>💡</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                Slots are optional — add as many as you like. Each slot can invite a known teammate or stay open for others to apply. You can always add more members after the team is created.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
              {slots.map((slot, i) => (
                <div key={i} style={{ background: "#f8f6f0", border: "2px solid #1a1a1a", borderRadius: "4px", padding: "1rem", position: "relative" }}>
                  <button type="button" onClick={() => removeSlot(i)} style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><IconX /></button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Role Title</label>
                      <input placeholder="e.g. Frontend Dev" value={slot.role_title} onChange={e => updateSlot(i, { role_title: e.target.value })} style={{...fieldStyle, padding: "0.4rem 0.6rem", minHeight: "36px"}} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Gender Req</label>
                      <select value={slot.gender} onChange={e => updateSlot(i, { gender: e.target.value })} style={{...fieldStyle, padding: "0.4rem 0.6rem", minHeight: "36px"}}>
                        <option value="any">Any</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem", textTransform: "uppercase" }}>
                      Invite Known Teammate (Optional)
                    </label>
                    {slot.prefill_user_name ? (
                      <div 
                        onClick={() => updateSlot(i, { prefill_user_id: undefined, prefill_user_name: undefined })}
                        style={{
                          background: "#e0e7ff",
                          border: "2px solid #5b5fc7",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#5b5fc7",
                          display: "inline-flex",
                          alignItems: "center",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)"
                        }}
                      >
                        ✅ {slot.prefill_user_name} 
                        <span style={{ marginLeft: "0.5rem", color: "#dc2626", fontSize: "0.7rem", textDecoration: "underline" }}>Remove</span>
                      </div>
                    ) : (
                      <UserSearchAutocomplete onSelect={(user) => updateSlot(i, { prefill_user_id: user.id, prefill_user_name: user.name })} />
                    )}
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>Required Skills</label>
                    <SkillSelector selectedSkills={slot.skills} onChange={skills => updateSlot(i, { skills })} />
                  </div>
                </div>
              ))}
            </div>
            {slots.length < 5 && (
              <button type="button" onClick={addSlot} style={{ padding: "0.65rem 1.25rem", background: "#ffffff", color: "#1a1a1a", border: "2px dashed #1a1a1a", borderRadius: "4px", fontWeight: 800, cursor: "pointer", width: "100%" }}>
                + Add Member Slot
              </button>
            )}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "2px solid #dc2626", borderRadius: "4px", padding: "0.85rem", color: "#dc2626", fontWeight: 700, fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>
              ⚠️ [ERROR]: {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.95rem",
                background: loading ? "#8890d4" : "#5b5fc7",
                color: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "4px 4px 0px #1a1a1a",
                borderRadius: "4px",
                fontWeight: 800,
                fontSize: "1.05rem",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                cursor: loading ? "not-allowed" : "pointer",
                minHeight: "48px",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#4a4fb5";
                  e.currentTarget.style.boxShadow = "5px 5px 0px #1a1a1a";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#5b5fc7";
                  e.currentTarget.style.boxShadow = "4px 4px 0px #1a1a1a";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? "Deploying Team Profile…" : <><IconRocket /> Confirm & Deploy Team</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateTeamPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>[INITIALIZING FORM...]</div>}>
      <CreateTeamForm />
    </Suspense>
  );
}
