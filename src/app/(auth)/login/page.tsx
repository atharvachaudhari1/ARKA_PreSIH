"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

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
      {/* Background glow removed for clean paper style */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          animation: "fade-up 0.4s ease forwards",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <BrandLogo size="lg" />
          </Link>
          <p style={{ marginTop: "1rem", color: "#1a1a1a", fontSize: "0.95rem", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            Welcome back // Secure Login
          </p>
        </div>

        <div
          className="card"
          style={{ padding: "2rem", border: "1.5px solid #1a1a1a", background: "#ffffff", boxShadow: "3px 3px 0px #1a1a1a", borderRadius: "2px" }}
        >
          {/* Google sign-in */}
          <button
            id="btn-google-login"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            style={{ width: "100%", gap: "0.75rem", marginBottom: "1.5rem", background: "#f7f4ee", color: "#1a1a1a", border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", borderRadius: "2px", fontWeight: 700, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.75rem" }}
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

          <div className="divider" style={{ marginBottom: "1.5rem", textAlign: "center", color: "#1a1a1a", fontWeight: "bold" }}>or</div>

          {/* Email / password form */}
          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label htmlFor="login-email" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Email</label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.ac.in"
                style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%" }}
                autoComplete="email"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <label htmlFor="login-password" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "0.875rem" }}>Password</label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ border: "1.5px solid #1a1a1a", borderRadius: "2px", padding: "0.6rem 0.85rem", backgroundColor: "#ffffff", color: "#1a1a1a", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.05)", width: "100%" }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  color: "#f87171",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              id="btn-email-login"
              type="submit"
              disabled={loading || googleLoading}
              style={{ width: "100%", marginTop: "0.5rem", background: "#5b5fc7", color: "#fff", border: "1.5px solid #1a1a1a", boxShadow: "2px 2px 0px #1a1a1a", borderRadius: "2px", fontWeight: 700, fontFamily: "var(--font-mono)", padding: "0.75rem", cursor: "pointer" }}
            >
              {loading ? "Signing in…" : "Sign in"}
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
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            style={{ color: "#5b5fc7", textDecoration: "none", fontWeight: 700 }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
