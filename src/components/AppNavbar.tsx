"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import NotificationCenter from "./NotificationCenter";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/teams", label: "Browse", icon: "🔍" },
  { href: "/requests", label: "Requests", icon: "📨" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
];

export default function AppNavbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        height: "60px",
        borderBottom: "1px solid var(--color-border)",
        background: "rgba(11,13,20,0.92)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "var(--color-text-primary)",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--color-brand-light)" }}>{"<"}</span>
        TeamUp
        <span style={{ color: "var(--color-brand-light)" }}>{"/>"}</span>
      </Link>

      {/* Desktop nav links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
        className="desktop-nav"
      >
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: active ? 600 : 400,
                color: active
                  ? "var(--color-brand-light)"
                  : "var(--color-text-secondary)",
                background: active
                  ? "rgba(99,102,241,0.1)"
                  : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right side controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <NotificationCenter />
        <Link
          href="/teams/create"
          className="btn btn-primary btn-sm"
          id="nav-create-team"
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}
        >
          + Create Team
        </Link>

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button
            id="nav-user-menu"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "0.3rem 0.75rem 0.3rem 0.4rem",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "0.8rem",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--gradient-brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail}
            </span>
            <span style={{ fontSize: "0.7rem" }}>▾</span>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 180,
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border-hover)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.5rem",
                  zIndex: 50,
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                    transition: "all 0.15s",
                  }}
                >
                  👤 My Profile
                </Link>
                <Link
                  href="/requests"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                    transition: "all 0.15s",
                  }}
                >
                  📨 My Requests
                </Link>
                <div
                  style={{
                    height: 1,
                    background: "var(--color-border)",
                    margin: "0.5rem 0",
                  }}
                />
                <button
                  id="nav-signout"
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                >
                  ↩ Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
