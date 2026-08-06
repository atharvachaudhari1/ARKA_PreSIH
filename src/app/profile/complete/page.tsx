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
  const [userId, setUserId] = useState("");

  const [step, setStep] = useState<1 | 2>(1);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [idCardPath, setIdCardPath] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [ocrData, setOcrData] = useState<{name?: string, college?: string, department?: string, score?: number} | null>(null);

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
    whatsapp_number: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        setUserId(user.id);
        const metaName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
        if (metaName) setForm((f) => ({ ...f, name: metaName }));
      }
    });
    const path = searchParams.get("path");
    if (path === "create") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPath("create");
    }
  }, [searchParams, supabase.auth]);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleIdCardSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large (max 5MB).");
      return;
    }
    
    setIdCardFile(file);
    setOcrLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("id_card", file);

    try {
      const uploadRes = await fetch("/api/users/id-upload", {
        method: "POST",
        body: formData,
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        const parsed = data.parsed;
        setIdCardPath(data.path);
        setOcrData(parsed);
        
        if (parsed.name || parsed.college || parsed.department) {
          setIsVerified(true);
          setForm((f) => ({
            ...f,
            name: parsed.name || f.name,
            college: parsed.college || f.college,
            department: parsed.department || f.department,
          }));
        } else {
          setIsVerified(false);
        }
      } else {
        const errorData = await uploadRes.json().catch(() => ({}));
        setError(errorData.error || "ID card upload failed. Please try again.");
        setIsVerified(false);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during upload.");
      setIsVerified(false);
    }

    setOcrLoading(false);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idCardPath) { setError("College ID card is required."); return; }
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
        whatsapp_number: form.whatsapp_number,
        id_card_storage_path: idCardPath,
        resume_storage_path: resumeStoragePath,
        intent: selectedPath,
        ocr_data: ocrData ? {
          score: ocrData.score || 0.1,
          parsed_name: ocrData.name || null,
          parsed_college: ocrData.college || null,
          parsed_department: ocrData.department || null,
        } : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Profile creation failed.");
      setLoading(false);
      return;
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
            
            {/* STEP 1: ID CARD UPLOAD */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ background: "var(--color-brand)", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>1</div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Verify Student ID <span style={{ color: "#ef4444" }}>*</span></h2>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Upload your college ID card. Our automated system will parse it and autofill your details.
              </p>
              
              <div style={{ marginTop: "0.5rem" }}>
                <input 
                  id="complete-id-card" 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,application/pdf" 
                  style={{ display: "none" }} 
                  onChange={handleIdCardSelect} 
                  disabled={ocrLoading}
                />
                
                {ocrLoading ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", background: "rgba(99,102,241,0.05)", border: "2px dashed var(--color-brand)", borderRadius: "var(--radius-md)" }}>
                    <div className="spinner" style={{ margin: "0 auto", marginBottom: "0.75rem", width: 24, height: 24, border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "var(--color-brand)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <p style={{ color: "var(--color-brand)", fontWeight: 600, fontSize: "0.9rem" }}>Scanning ID Card...</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById("complete-id-card")?.click()}
                    className="btn btn-secondary"
                    style={{ width: "100%", justifyContent: "center", padding: "1.25rem", borderStyle: "dashed", borderWidth: 2 }}
                  >
                    {idCardFile ? `🪪 ${idCardFile.name} (Click to change)` : "🪪 Choose ID Card File"}
                  </button>
                )}
                
                {isVerified && !ocrLoading && (
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "0.5rem 0.75rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                    ✅ Details successfully extracted and verified!
                  </div>
                )}
                {!isVerified && idCardPath && !ocrLoading && (
                  <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "0.5rem 0.75rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                    ⚠️ We couldn't fully read your ID. Please fill the details manually.
                  </div>
                )}
              </div>
            </div>

            {/* STEP 2: PROFILE DETAILS */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", animation: "fade-up 0.4s ease" }}>
                <div style={{ height: 1, background: "var(--color-border-hover)" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ background: "var(--color-brand)", color: "#fff", width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800 }}>2</div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Profile Details</h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  {isVerified && (form.name !== ocrData?.name || form.college !== ocrData?.college || form.department !== ocrData?.department) && (
                    <div style={{ gridColumn: "1 / -1", background: "rgba(245,158,11,0.1)", color: "#d97706", border: "1px solid rgba(245,158,11,0.3)", padding: "0.75rem 1rem", borderRadius: "4px", fontSize: "0.85rem", fontWeight: 600 }}>
                      ⚠️ Changing your Name, College, or Department will require re-verification of your college ID.
                    </div>
                  )}
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
            )}

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button id="btn-complete-profile" type="submit" disabled={loading || step === 1} className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
              {loading ? "Saving…" : "Complete Profile →"}
            </button>
            <style jsx>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
              @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
          </form>
        </div>
      </div>
    </div>
  );
}
