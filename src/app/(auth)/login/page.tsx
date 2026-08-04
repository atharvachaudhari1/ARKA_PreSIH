"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconEye({ off }: { off?: boolean }) {
  if (off) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem", position: "relative" }}>
      {/* Ambient glows */}
      <div style={{ position: "fixed", top: "10%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(65,67,106,0.5) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "10%", right: "20%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(246,70,104,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: 420, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--gradient-brand)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(246,70,104,0.45)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              Team<span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Up</span>
            </span>
          </Link>
          <p style={{ marginTop: "0.6rem", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Welcome back</p>
        </div>

        <div className="card" style={{ padding: "2rem", border: "1px solid var(--color-border-hover)" }}>
          {/* Google */}
          <button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="btn btn-secondary"
            style={{ width: "100%", gap: "0.75rem", marginBottom: "1.5rem" }}
          >
            {googleLoading ? <span style={{ opacity: 0.7 }}>Redirecting…</span> : <><IconGoogle />Continue with Google</>}
          </button>

          <div className="divider" style={{ marginBottom: "1.5rem" }}>or sign in with email</div>

          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label htmlFor="login-email" className="input-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <IconMail /> Email
              </label>
              <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.ac.in" className="input-field" autoComplete="email" />
            </div>
            <div>
              <label htmlFor="login-password" className="input-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <IconLock /> Password
              </label>
              <div style={{ position: "relative" }}>
                <input id="login-password" type={showPass ? "text" : "password"} required value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="input-field" autoComplete="current-password" style={{ paddingRight: "2.75rem" }} />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 0 }}>
                  <IconEye off={showPass} />
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(246,70,104,0.10)", border: "1px solid rgba(246,70,104,0.25)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", color: "var(--ember-coral)", fontSize: "0.875rem" }}>
                {error}
              </div>
            )}

            <button id="btn-email-login" type="submit" disabled={loading || googleLoading} className="btn btn-primary" style={{ width: "100%", marginTop: "0.25rem" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--ember-peach)", textDecoration: "none", fontWeight: 600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
