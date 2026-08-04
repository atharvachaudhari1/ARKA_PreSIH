"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import NotificationCenter from "./NotificationCenter";

// ── SVG Icons ──────────────────────────────────────────────────────────────
function IconHome() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Home",     icon: <IconHome /> },
  { href: "/teams",     label: "Browse",   icon: <IconSearch /> },
  { href: "/requests",  label: "Requests", icon: <IconInbox /> },
];

export default function AppNavbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 1.5rem", height: 60,
      borderBottom: "1px solid var(--color-border)",
      background: "rgba(28,30,48,0.92)",
      backdropFilter: "blur(16px)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: "var(--gradient-brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(246,70,104,0.4)",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
          Team<span style={{ background: "var(--gradient-warm)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Up</span>
        </span>
      </Link>

      {/* Desktop nav links */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="desktop-nav">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} style={{
              display: "flex", alignItems: "center", gap: "0.45rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: active ? 700 : 500,
              color: active ? "var(--ember-peach)" : "var(--color-text-secondary)",
              background: active ? "rgba(246,70,104,0.10)" : "transparent",
              transition: "all 0.15s ease",
            }}>
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <NotificationCenter />

        <Link href="/teams/create" className="btn btn-primary btn-sm" id="nav-create-team" style={{ textDecoration: "none", gap: "0.35rem" }}>
          <IconPlus />
          Create Team
        </Link>

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button
            id="nav-user-menu"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-full)",
              padding: "0.28rem 0.75rem 0.28rem 0.35rem",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "0.8rem",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "var(--gradient-brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userEmail.split("@")[0]}
            </span>
            <IconChevronDown />
          </button>

          {menuOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                minWidth: 190,
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border-hover)",
                borderRadius: "var(--radius-md)",
                padding: "0.4rem",
                zIndex: 50,
                boxShadow: "var(--shadow-lg)",
              }}>
                {[
                  { href: "/profile",  label: "My Profile",   icon: <IconUser /> },
                  { href: "/requests", label: "My Requests",  icon: <IconInbox /> },
                ].map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    textDecoration: "none",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ color: "var(--ember-peach)" }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div style={{ height: 1, background: "var(--color-border)", margin: "0.4rem 0" }} />
                <button
                  id="nav-signout"
                  onClick={handleSignOut}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)",
                    background: "none", border: "none",
                    color: "var(--ember-coral)", fontSize: "0.875rem",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <IconLogOut />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
