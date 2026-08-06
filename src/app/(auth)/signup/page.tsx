"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { IconDashboardGrid, IconTerminalPrompt } from "@/components/TerminalIcons";

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pre-select path from URL param (?path=join or ?path=create)
  const [selectedPath, setSelectedPath] = useState<"join" | "create" | null>(null);

  useEffect(() => {
    const path = searchParams.get("path");
    if (path === "join" || path === "create") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPath(path);
    }
  }, [searchParams]);

  const [step, setStep] = useState<"path" | "account" | "profile">("path");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    gender: "" as "male" | "female" | "",
    college: "",
    department: "",
    past_hackathons_count: "0",
    bio: "",
  });

  const [idCard, setIdCard] = useState<File | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?path=${selectedPath ?? "join"}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (!idCard) {
      setError("College ID card is required.");
      return;
    }
    setLoading(true);
    setError(null);

    // 1. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    });

    if (authErr || !authData.user) {
      setError(authErr?.message ?? "Signup failed.");
      setLoading(false);
      return;
    }

    // 2. Upload ID card to private storage bucket
    const fileExt = idCard.name.split(".").pop();
    const storagePath = `id-cards/${authData.user.id}/id_card.${fileExt}`;
    const { error: uploadErr } = await supabase.storage
      .from("id-cards") // private bucket
      .upload(storagePath, idCard, { upsert: true });

    if (uploadErr) {
      setError("ID card upload failed: " + uploadErr.message);
      setLoading(false);
      return;
    }

    // 3. Create user profile via API route
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
        intent: selectedPath, // join | create
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

  // ── Render: Step 1 — Choose path ──
  if (step === "path" && !selectedPath) {
    return (
      <PathSelectionScreen
        onSelect={(p) => { setSelectedPath(p); setStep("account"); }}
      />
    );
  }

  // ── Render: Step 2 — Account creation ──
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f4ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "460px", animation: "fade-up 0.4s ease forwards" }}>
        {/* Logo + back */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <BrandLogo size="lg" />
          </Link>
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <span
              style={{
                background: selectedPath === "join" ? "rgba(91,95,199,0.1)" : "rgba(217,119,6,0.1)",
                border: `1.5px solid ${selectedPath === "join" ? "#5b5fc7" : "#d97706"}`,
                borderRadius: "2px",
                padding: "0.25rem 0.85rem",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: selectedPath === "join" ? "#5b5fc7" : "#d97706",
                fontWeight: 700,
              }}
            >
              {selectedPath === "join" ? "// joining a team" : "// creating a team"}
            </span>
            <button
              onClick={() => { setSelectedPath(null); setStep("path"); }}
              style={{
                background: "#f7f4ee",
                border: "1.5px solid #1a1a1a",
                borderRadius: "2px",
                padding: "0.25rem 0.5rem",
                color: "#1a1a1a",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "1px 1px 0px #1a1a1a",
                fontFamily: "var(--font-mono)"
              }}
            >
              change back
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: "2rem", border: "1.5px solid #1a1a1a", background: "#ffffff", boxShadow: "3px 3px 0px #1a1a1a", borderRadius: "2px" }}>
          {/* Google */}
          <button
            id="btn-google-signup"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            style={{ width: "100%", gap: "0.75rem", marginBottom: "1.5rem", background: "#f7f4ee", color: "#1a1a1a", border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", borderRadius: "2px", fontWeight: 700, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem", cursor: "pointer" }}
          >
            {googleLoading ? (
              <span style={{ opacity: 0.7 }}>Redirecting…</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="divider" style={{ marginBottom: "1.5rem", textAlign: "center", color: "#1a1a1a", fontWeight: "bold" }}>or create account</div>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-name" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Full name</label>
                <input
                  id="signup-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Aarav Sharma"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-email" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Email</label>
                <input
                  id="signup-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="personal/college email"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                  autoComplete="email"
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-gender" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Gender</label>
                <select
                  id="signup-gender"
                  required
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box", cursor: "pointer" }}
                >
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-college" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>College</label>
                <input
                  id="signup-college"
                  type="text"
                  required
                  value={form.college}
                  onChange={(e) => update("college", e.target.value)}
                  placeholder="IIT Bombay"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-dept" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Department</label>
                <input
                  id="signup-dept"
                  type="text"
                  required
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  placeholder="CSE"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-password" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Password</label>
                <input
                  id="signup-password"
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                  autoComplete="new-password"
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-confirm-password" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Confirm password</label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%", boxSizing: "border-box" }}
                  autoComplete="new-password"
                />
              </div>

              {/* ID Card upload — mandatory */}
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="signup-id-card" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>
                  College ID card{" "}
                  <span style={{ color: "#444", fontWeight: 400 }}>
                    (required for verification)
                  </span>
                </label>
                <div
                  style={{
                    border: `1.5px dashed #1a1a1a`,
                    borderRadius: "2px",
                    padding: "1.25rem",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    background: idCard ? "#f7f4ee" : "#ffffff",
                    position: "relative",
                  }}
                  onClick={() => document.getElementById("signup-id-card")?.click()}
                >
                  <input
                    id="signup-id-card"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => setIdCard(e.target.files?.[0] ?? null)}
                  />
                  {idCard ? (
                    <div>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>✅</div>
                      <div style={{ fontSize: "0.875rem", color: "#1a1a1a", fontWeight: 700 }}>
                        {idCard.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#444", marginTop: "0.2rem" }}>
                        {(idCard.size / 1024).toFixed(0)} KB · Click to change
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>🪪</div>
                      <div style={{ fontSize: "0.875rem", color: "#1a1a1a", fontWeight: 700 }}>
                        Upload your college ID
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#444", marginTop: "0.2rem" }}>
                        JPG, PNG, PDF · Max 5 MB
                      </div>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: "0.72rem", color: "#444", marginTop: "0.4rem" }}>
                  🔒 Only seen by our automated verification system. Never shown to other users.
                </p>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1.5px solid #1a1a1a",
                  borderRadius: "2px",
                  padding: "0.75rem 1rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  fontWeight: 600
                }}
              >
                {error}
              </div>
            )}

            <button
              id="btn-create-account"
              type="submit"
              disabled={loading || googleLoading}
              style={{ width: "100%", marginTop: "0.5rem", background: "#5b5fc7", color: "#fff", border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", borderRadius: "2px", fontWeight: 700, fontFamily: "var(--font-mono)", padding: "0.75rem", cursor: "pointer" }}
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.5rem",
            color: "#1a1a1a",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "#5b5fc7", textDecoration: "none", fontWeight: 700 }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Path Selection Screen (Devfolio-style) ──
function PathSelectionScreen({
  onSelect,
}: {
  onSelect: (path: "join" | "create") => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f4ee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        gap: "2.5rem",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <BrandLogo size="lg" />
        </Link>
        <h1
          style={{
            marginTop: "2rem",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            color: "#1a1a1a"
          }}
        >
          What are you here to do?
        </h1>
        <p
          style={{
            marginTop: "0.75rem",
            color: "#1a1a1a",
            fontWeight: 500,
            fontSize: "1rem",
          }}
        >
          You can always switch later.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          width: "100%",
          maxWidth: "620px",
        }}
      >
        {/* Join */}
        <button
          id="path-join-team"
          onClick={() => onSelect("join")}
          style={{
            background: "#ffffff",
            border: "2px solid #1a1a1a",
            boxShadow: "4px 4px 0px #1a1a1a",
            borderRadius: "2px",
            padding: "2.5rem 2rem",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s ease",
            color: "#1a1a1a",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px, -2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0px #1a1a1a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(0px, 0px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #1a1a1a";
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "2px",
              border: "1.5px solid #1a1a1a",
              background: "#e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              boxShadow: "2px 2px 0px #1a1a1a"
            }}
          >
            <IconDashboardGrid size={32} color="#5b5fc7" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.6rem" }}>
            Join a Team
          </h2>
          <p style={{ color: "#444", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Browse open teams, check their skill gaps, and request to join — your
            profile is only shared with the teams you apply to.
          </p>
          <div
            style={{
              marginTop: "1.5rem",
              color: "#5b5fc7",
              fontWeight: 800,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            Get started →
          </div>
        </button>

        {/* Create */}
        <button
          id="path-create-team"
          onClick={() => onSelect("create")}
          style={{
            background: "#ffffff",
            border: "2px solid #1a1a1a",
            boxShadow: "4px 4px 0px #1a1a1a",
            borderRadius: "2px",
            padding: "2.5rem 2rem",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.2s ease",
            color: "#1a1a1a",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(-2px, -2px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "6px 6px 0px #1a1a1a";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translate(0px, 0px)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0px #1a1a1a";
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "2px",
              border: "1.5px solid #1a1a1a",
              background: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              boxShadow: "2px 2px 0px #1a1a1a"
            }}
          >
            <IconTerminalPrompt size={32} color="#5b5fc7" />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.6rem" }}>
            Create a Team
          </h2>
          <p style={{ color: "#444", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Start a team and become the leader. Define what skills you need, invite
            people or let them find you — you make the final call on who joins.
          </p>
          <div
            style={{
              marginTop: "1.5rem",
              color: "#d97706",
              fontWeight: 800,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            Build your team →
          </div>
        </button>
      </div>

      <p
        style={{
          color: "#1a1a1a",
          fontSize: "0.875rem",
          marginTop: "1.5rem",
          fontWeight: 500
        }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#5b5fc7", textDecoration: "none", fontWeight: 700 }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
