"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * Profile completion page — shown to Google OAuth users on first login.
 * They skip the signup form so need to provide profile details here.
 */
export default function ProfileCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [selectedPath, setSelectedPath] = useState<"join" | "create">("join");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState({
    name: "",
    gender: "",
    college: "",
    department: "",
    past_hackathons_count: "0",
    bio: "",
  });
  const [idCard, setIdCard] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        // Pre-fill name from Google metadata if available
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idCard) { setError("College ID card is required."); return; }
    if (!form.gender) { setError("Please select your gender."); return; }
    setLoading(true);
    setError(null);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please log in again."); setLoading(false); return; }

    // 2. Upload ID card
    const fileExt = idCard.name.split(".").pop();
    const storagePath = `id-cards/${user.id}/id_card.${fileExt}`;
    const { error: uploadErr } = await supabase.storage
      .from("id-cards")
      .upload(storagePath, idCard, { upsert: true });
    if (uploadErr) { setError("ID card upload failed: " + uploadErr.message); setLoading(false); return; }

    // 3. Create profile via API
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
        id_card_storage_path: storagePath,
        intent: selectedPath,
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

      <div style={{ width: "100%", maxWidth: "500px", animation: "fade-up 0.4s ease forwards" }}>
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
              {p === "join" ? "🔍 Join a Team" : "⚡ Create a Team"}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: "2rem", border: "1px solid var(--color-border-hover)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="complete-name" className="input-label">Full name</label>
                <input id="complete-name" type="text" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Aarav Sharma" className="input-field" />
              </div>

              <div>
                <label htmlFor="complete-gender" className="input-label">Gender</label>
                <input id="complete-gender" type="text" required value={form.gender} onChange={(e) => update("gender", e.target.value)} placeholder="e.g. Female, Male, Non-binary" className="input-field" />
              </div>

              <div>
                <label htmlFor="complete-hackathons" className="input-label">Past hackathons</label>
                <input id="complete-hackathons" type="number" min="0" max="50" value={form.past_hackathons_count} onChange={(e) => update("past_hackathons_count", e.target.value)} className="input-field" />
              </div>

              <div>
                <label htmlFor="complete-college" className="input-label">College</label>
                <input id="complete-college" type="text" required value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="IIT Bombay" className="input-field" />
              </div>

              <div>
                <label htmlFor="complete-dept" className="input-label">Department</label>
                <input id="complete-dept" type="text" required value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="CSE" className="input-field" />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="complete-bio" className="input-label">Bio <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <textarea id="complete-bio" value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Tell teams a bit about yourself…" className="input-field" rows={3} style={{ resize: "vertical" }} />
              </div>

              {/* ID Card upload */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="complete-id-card" className="input-label">College ID card <span style={{ color: "#ef4444" }}>*</span></label>
                <div
                  style={{
                    border: `2px dashed ${idCard ? "var(--color-brand)" : "var(--color-border-hover)"}`,
                    borderRadius: "var(--radius-md)",
                    padding: "1.25rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: idCard ? "rgba(99,102,241,0.05)" : "transparent",
                    transition: "all 0.18s ease",
                  }}
                  onClick={() => document.getElementById("complete-id-card")?.click()}
                >
                  <input id="complete-id-card" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" style={{ display: "none" }} onChange={(e) => setIdCard(e.target.files?.[0] ?? null)} />
                  {idCard ? (
                    <div>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>✅</div>
                      <div style={{ fontSize: "0.875rem", fontWeight: 500 }}>{idCard.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>{(idCard.size / 1024).toFixed(0)} KB · Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🪪</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", fontWeight: 500 }}>Upload your college ID</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>JPG, PNG, PDF · Max 5 MB</div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>🔒 Only seen by our automated verification system. Never shown to other users.</p>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button id="btn-complete-profile" type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: "0.25rem" }}>
              {loading ? "Saving…" : "Complete profile →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
