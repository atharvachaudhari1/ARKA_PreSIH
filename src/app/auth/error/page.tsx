import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Authentication Error" };

export default function AuthErrorPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-base)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <div style={{ fontSize: "3rem" }}>⚠️</div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Authentication failed</h1>
      <p style={{ color: "var(--color-text-secondary)", maxWidth: "360px" }}>
        Something went wrong during sign-in. Please try again. If the problem
        persists, contact support.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
        <Link href="/login" className="btn btn-primary">
          Try again
        </Link>
        <Link href="/" className="btn btn-ghost">
          Go home
        </Link>
      </div>
    </div>
  );
}
