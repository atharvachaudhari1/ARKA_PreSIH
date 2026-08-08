"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BrandLogo from "@/components/BrandLogo";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}

/**
 * Handles every auth redirect back into the app:
 * - OAuth (implicit or PKCE): tokens arrive in the URL hash / ?code= and the
 *   browser supabase client picks them up automatically on initialization.
 * - Email confirmation / magic-link: the confirmation link lands on this page
 *   with the same implicit tokens, which the browser client also processes.
 *
 * The server never sees hash tokens, so this MUST be a client component. Once a
 * session is established we check whether the Prisma profile exists and route
 * accordingly: first-time users -> /profile/complete, everyone else -> next.
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const path = searchParams.get("path") ?? "join"; // "join" | "create"
    const next =
      searchParams.get("next") ??
      (path === "create" ? "/teams/create" : "/dashboard");

    async function routeToApp() {
      const profileRes = await fetch("/api/users/profile");
      if (cancelled) return;
      if (profileRes.status === 404) {
        window.location.assign(`/profile/complete?path=${encodeURIComponent(path)}`);
      } else if (profileRes.ok) {
        window.location.assign(next);
      } else {
        setError("Could not verify your account. Please try again.");
      }
    }

    // Fire-and-forget: browser client detects the callback tokens and emits
    // SIGNED_IN, which is the common path. getSession() covers the case where
    // the event fired before we subscribed (e.g. already-authenticated visit).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        routeToApp();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !cancelled) {
        routeToApp();
      }
    });

    const timer = setTimeout(() => {
      if (!cancelled) {
        setError("Sign-in could not be completed. Please try again.");
      }
    }, 20000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  if (error) {
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
        <div
          className="card"
          style={{
            maxWidth: "420px",
            width: "100%",
            padding: "2rem",
            border: "1.5px solid #1a1a1a",
            background: "#ffffff",
            boxShadow: "3px 3px 0px #1a1a1a",
            borderRadius: "2px",
            textAlign: "center",
          }}
        >
          <BrandLogo size="lg" />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "1.25rem 0 0.5rem", color: "#1a1a1a" }}>
            Sign-in failed
          </h2>
          <p style={{ color: "#444", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
            {error}
          </p>
          <Link
            href="/login"
            style={{ color: "#5b5fc7", textDecoration: "none", fontWeight: 700, fontFamily: "var(--font-mono)" }}
          >
            Go to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return <CallbackLoading />;
}

function CallbackLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f4ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div style={{ textAlign: "center", color: "#1a1a1a" }}>
        <BrandLogo size="lg" />
        <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", fontWeight: 700 }}>
          {`$ verifying_session --wait`}
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#666" }}>
          Finalizing your login…
        </p>
      </div>
    </div>
  );
}
