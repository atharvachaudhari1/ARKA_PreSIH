"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Search, Zap } from "lucide-react";

export default function ProfileCompletePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>Loading...</div>}>
      <ProfileCompleteContent />
    </Suspense>
  );
}

function ProfileCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [selectedPath, setSelectedPath] = useState<"join" | "create">("join");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [form, setForm] = useState<{
    name: string;
    gender: string;
    college: string;
    department: string;
    past_hackathons_count: string;
    bio: string;
    github_url: string;
    linkedin_url: string;
    portfolio_url: string;
    whatsapp_number: string;
  }>({
    name: "",
    gender: "",
    college: "",
    department: "",
    past_hackathons_count: "0",
    bio: "",
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
    whatsapp_number: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        const meta = user.user_metadata ?? {};
        const metaName = meta.full_name ?? meta.name ?? "";
        if (metaName) setForm((f) => ({ ...f, name: metaName }));
        if (meta.gender) setForm((f) => ({ ...f, gender: meta.gender }));
        if (meta.college) setForm((f) => ({ ...f, college: meta.college }));
        if (meta.department) setForm((f) => ({ ...f, department: meta.department }));
        if (meta.past_hackathons_count != null) {
          setForm((f) => ({ ...f, past_hackathons_count: String(meta.past_hackathons_count) }));
        }
      }
    });
    const path = searchParams.get("path");
    if (path === "create") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPath("create");
    }

    // Pre-fill with the profile data the user entered during signup (saved when
    // email confirmation was required) — they never re-type these fields.
    try {
      const pending = localStorage.getItem("teamup_pending_profile");
      if (pending) {
        const data = JSON.parse(pending);
        setForm((f) => ({
          ...f,
          name: data.name ?? f.name,
          gender: data.gender ?? f.gender,
          college: data.college ?? f.college,
          department: data.department ?? f.department,
          past_hackathons_count: data.past_hackathons_count ?? f.past_hackathons_count,
        }));
        if (data.path === "create") {
          setSelectedPath("create");
        }
      }
    } catch {
      // Ignore malformed/absent pending data.
    }
  }, [searchParams, supabase.auth]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.gender) { setError("Please select your gender."); return; }
    setLoading(true);
    setError(null);

    if (form.github_url && !form.github_url.match(/^https?:\/\/(www\.)?github\.com\/.+/)) {
      setError("Please provide a valid GitHub profile URL (e.g. https://github.com/username)");
      setLoading(false); return;
    }
    if (form.linkedin_url && !form.linkedin_url.match(/^https?:\/\/(www\.)?linkedin\.com\/.+/)) {
      setError("Please provide a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)");
      setLoading(false); return;
    }
    if (form.portfolio_url && !/^https?:\/\/\S+$/.test(form.portfolio_url)) {
      setError("Please provide a valid Portfolio URL (e.g. https://yourportfolio.dev)");
      setLoading(false); return;
    }
    if (form.whatsapp_number && !form.whatsapp_number.match(/^\+?[1-9]\d{1,14}$/)) {
      setError("Please provide a valid WhatsApp number with country code (e.g. +919876543210)");
      setLoading(false); return;
    }

    let resumeStoragePath = undefined;
    if (resumeFile) {
      const resumeFormData = new FormData();
      resumeFormData.append("resume", resumeFile);
      const rRes = await fetch("/api/users/resume", {
        method: "POST",
        body: resumeFormData,
      });

      if (!rRes.ok) {
        const errorData = await rRes.json().catch(() => ({}));
        setError(errorData.error || "Resume upload failed. Please try again.");
        setLoading(false); return;
      }
      
      const rData = await rRes.json();
      resumeStoragePath = rData.path;
    }

    const res = await fetch("/api/users/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        gender: form.gender,
        college: form.college,
        department: form.department,
        past_hackathons_count: parseInt(form.past_hackathons_count, 10),
        bio: form.bio,
        github_url: form.github_url,
        linkedin_url: form.linkedin_url,
        portfolio_url: form.portfolio_url,
        whatsapp_number: form.whatsapp_number,
        resume_storage_path: resumeStoragePath,
        intent: selectedPath,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Profile creation failed.");
      setLoading(false);
      return;
    }

    // Profile created — the pending signup data is no longer needed.
    try {
      localStorage.removeItem("teamup_pending_profile");
    } catch {
      // ignore
    }

    router.push(selectedPath === "create" ? "/teams/create" : "/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-base)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20%", left: "50%",
          transform: "translateX(-50%)",
          width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: "600px", animation: "fade-up 0.4s ease forwards", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.4rem", color: "var(--color-text-primary)", textDecoration: "none" }}>
            <span style={{ color: "var(--color-brand-light)" }}>{"<"}</span>TeamUp<span style={{ color: "var(--color-brand-light)" }}>{"/>"}</span>
          </Link>
          <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 800 }}>Complete your profile</h1>
          <p style={{ marginTop: "0.4rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            Signed in as <span style={{ color: "var(--color-brand-light)" }}>{userEmail}</span>
          </p>
        </div>

        {/* Path toggle */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {(["join", "create"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPath(p)}
              style={{
                flex: 1,
                padding: "0.6rem",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${selectedPath === p ? "var(--color-brand)" : "var(--color-border)"}`,
                background: selectedPath === p ? "rgba(99,102,241,0.1)" : "var(--color-bg-elevated)",
                color: selectedPath === p ? "var(--color-brand-light)" : "var(--color-text-secondary)",
                fontWeight: selectedPath === p ? 600 : 400,
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                {p === "join" ? <Search size={18} color="#3b82f6" /> : <Zap size={18} color="#f59e0b" fill="#f59e0b" />}
                <span>{p === "join" ? "Join a Team" : "Create a Team"}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "2rem", border: "1px solid var(--color-border-hover)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* PROFILE DETAILS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ height: 1, background: "var(--color-border-hover)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ background: "var(--color-brand)", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>1</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Profile Details</h2>
              </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="complete-name" className="input-label">Full name</label>
                    <input id="complete-name" type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Aarav Sharma" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-college" className="input-label">College</label>
                    <input id="complete-college" type="text" required value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="IIT Bombay" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-dept" className="input-label">Department</label>
                    <input id="complete-dept" type="text" required value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="CSE" className="input-field" />
                  </div>
                  
                  <div>
                    <label htmlFor="complete-gender" className="input-label">Gender <span style={{ color: "#ef4444" }}>*</span></label>
                    <input id="complete-gender" type="text" required value={form.gender} onChange={(e) => update("gender", e.target.value)} placeholder="e.g. Female, Male, Non-binary" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-hackathons" className="input-label">Past hackathons</label>
                    <input id="complete-hackathons" type="number" min="0" max="50" value={form.past_hackathons_count} onChange={(e) => update("past_hackathons_count", e.target.value)} className="input-field" />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label htmlFor="complete-bio" className="input-label">Bio <span style={{ color: "#ef4444" }}>*</span></label>
                    <textarea id="complete-bio" required value={form.bio ?? ""} onChange={(e) => update("bio", e.target.value)} placeholder="Tell teams a bit about yourself…" className="input-field" rows={3} style={{ resize: "vertical" }} />
                  </div>

                  <div>
                    <label htmlFor="complete-whatsapp" className="input-label">WhatsApp Number <span style={{ color: "#ef4444" }}>*</span></label>
                    <input id="complete-whatsapp" type="tel" required value={form.whatsapp_number ?? ""} onChange={(e) => update("whatsapp_number", e.target.value)} placeholder="+919876543210" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-linkedin" className="input-label">LinkedIn URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="complete-linkedin" type="url" value={form.linkedin_url ?? ""} onChange={(e) => update("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/yourusername" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-github" className="input-label">GitHub URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="complete-github" type="url" value={form.github_url ?? ""} onChange={(e) => update("github_url", e.target.value)} placeholder="https://github.com/yourusername" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="complete-portfolio" className="input-label">Portfolio URL <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                    <input id="complete-portfolio" type="url" value={form.portfolio_url ?? ""} onChange={(e) => update("portfolio_url", e.target.value)} placeholder="https://yourportfolio.dev/…" className="input-field" />
                  </div>

                  <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                    <label className="input-label">Resume <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                    <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                      Upload your resume to stand out. Highly recommended if you want to create a team!
                    </p>
                    <input 
                      id="complete-resume" 
                      type="file" 
                      accept="application/pdf" 
                      style={{ display: "none" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          setResumeFile(null);
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Resume file is too large (max 2MB).");
                          e.target.value = "";
                          return;
                        }
                        setResumeFile(file);
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("complete-resume")?.click()}
                      className="btn btn-secondary"
                      style={{ width: "100%", justifyContent: "center", padding: "1rem" }}
                    >
                      {resumeFile ? `📄 ${resumeFile.name} (Click to change)` : "📄 Upload Resume (PDF)"}
                    </button>
                  </div>
                </div>
              </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button id="btn-complete-profile" type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Saving…" : "Complete Profile →"}
            </button>
            <style jsx>{`
              @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </form>
        </div>
      </div>
    </div>
  );
}
