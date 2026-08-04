"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationCenter from "./NotificationCenter";
import { 
  IconTerminalPrompt, 
  IconDashboardGrid, 
  IconConsoleAlert, 
  IconSquadUsers,
  IconRocketDeploy 
} from "./TerminalIcons";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home", icon: <IconTerminalPrompt size={20} /> },
  { href: "/teams", label: "Browse", icon: <IconDashboardGrid size={20} /> },
  { href: "/requests", label: "Requests", icon: <IconConsoleAlert size={20} /> },
  { href: "/notifications", label: "Alerts", icon: <IconConsoleAlert size={20} color="#d97706" /> },
];

export default function AppNavbar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          height: "68px",
          borderBottom: "2px solid #1a1a1a",
          background: "#ffffff",
          boxShadow: "0 4px 0px rgba(26, 26, 26, 0.06)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 900,
            fontSize: "1.3rem",
            color: "#1a1a1a",
            textDecoration: "none",
            flexShrink: 0,
            letterSpacing: "-0.5px",
          }}
        >
          <span style={{ color: "#5b5fc7" }}>{"<"}</span>
          TeamUp
          <span style={{ color: "#5b5fc7" }}>{"/>"}</span>
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          className="desktop-only"
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
                  padding: "0.45rem 0.9rem",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontFamily: active ? "var(--font-mono)" : "inherit",
                  fontWeight: active ? 800 : 600,
                  color: "#1a1a1a",
                  background: active ? "#eef0ff" : "transparent",
                  border: active ? "2px solid #1a1a1a" : "2px solid transparent",
                  boxShadow: active ? "3px 3px 0px #1a1a1a" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center" }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationCenter />

          {/* Desktop Create Button */}
          <Link
            href="/teams/create"
            className="desktop-only"
            id="nav-create-team"
            style={{ 
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem", 
              fontSize: "0.85rem", 
              fontWeight: 800,
              textDecoration: "none",
              background: "#5b5fc7",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px #1a1a1a",
              borderRadius: "4px",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "all 0.15s ease"
            }}
          >
            <IconRocketDeploy size={18} color="#ffffff" style={{ filter: "drop-shadow(1px 1px 0px #000)" }} />
            Create Team
          </Link>

          {/* User menu (Desktop only) */}
          <div style={{ position: "relative" }} className="desktop-only">
            <button
              id="nav-user-menu"
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                background: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "3px 3px 0px #1a1a1a",
                borderRadius: "4px",
                padding: "0.35rem 0.85rem 0.35rem 0.45rem",
                cursor: "pointer",
                color: "#1a1a1a",
                fontWeight: 700,
                fontSize: "0.85rem",
                transition: "all 0.15s ease",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "4px",
                  background: "#1a1a1a",
                  border: "1.5px solid #1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  color: "#ffffff",
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
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 40 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    minWidth: 200,
                    background: "#ffffff",
                    border: "2px solid #1a1a1a",
                    borderRadius: "6px",
                    padding: "0.6rem",
                    zIndex: 50,
                    boxShadow: "5px 5px 0px #1a1a1a",
                  }}
                >
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "4px",
                      textDecoration: "none",
                      color: "#1a1a1a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    <IconSquadUsers size={18} /> My Profile
                  </Link>
                  <Link
                    href="/requests"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "4px",
                      textDecoration: "none",
                      color: "#1a1a1a",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    <IconConsoleAlert size={18} /> My Requests
                  </Link>
                  <div style={{ height: 2, background: "#1a1a1a", margin: "0.5rem 0" }} />
                  <button
                    id="nav-signout"
                    onClick={handleSignOut}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "4px",
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ↩ Sign out
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobile-only"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            style={{
              background: mobileNavOpen ? "#1a1a1a" : "#ffffff",
              color: mobileNavOpen ? "#ffffff" : "#1a1a1a",
              border: "2px solid #1a1a1a",
              boxShadow: "2.5px 2.5px 0px #1a1a1a",
              borderRadius: "4px",
              padding: "0.45rem 0.75rem",
              fontSize: "1.2rem",
              fontWeight: 900,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              fontFamily: "var(--font-mono)"
            }}
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* ── Mobile Dropdown Terminal Menu ── */}
      {mobileNavOpen && (
        <div 
          className="mobile-block"
          style={{
            position: "fixed",
            top: "68px",
            left: 0,
            width: "100%",
            background: "#ffffff",
            borderBottom: "3px solid #1a1a1a",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            zIndex: 49,
            padding: "1.25rem 1.25rem 1.75rem",
            boxSizing: "border-box"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#777", letterSpacing: "1px" }}>
              [NAVIGATION PIPELINE]
            </div>
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileNavOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "1rem",
                    fontFamily: active ? "var(--font-mono)" : "inherit",
                    fontWeight: active ? 800 : 700,
                    color: "#1a1a1a",
                    background: active ? "#eef0ff" : "#fdfbf7",
                    border: "2px solid #1a1a1a",
                    boxShadow: "2.5px 2.5px 0px #1a1a1a",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center" }}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}

            <div style={{ height: 2, background: "#1a1a1a", margin: "0.5rem 0" }} />

            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#777", letterSpacing: "1px" }}>
              [USER DOSSIER // {userEmail}]
            </div>

            <Link
              href="/teams/create"
              onClick={() => setMobileNavOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.85rem",
                background: "#5b5fc7",
                color: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "4px 4px 0px #1a1a1a",
                borderRadius: "4px",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "0.95rem",
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              <IconRocketDeploy size={20} color="#ffffff" style={{ filter: "drop-shadow(1px 1px 0px #000)" }} />
              + Create New Team
            </Link>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.25rem" }}>
              <Link
                href="/profile"
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.7rem",
                  background: "#ffffff",
                  border: "2px solid #1a1a1a",
                  boxShadow: "2.5px 2.5px 0px #1a1a1a",
                  borderRadius: "4px",
                  textDecoration: "none",
                  color: "#1a1a1a",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                <IconSquadUsers size={18} /> Profile
              </Link>
              <Link
                href="/requests"
                onClick={() => setMobileNavOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  padding: "0.7rem",
                  background: "#ffffff",
                  border: "2px solid #1a1a1a",
                  boxShadow: "2.5px 2.5px 0px #1a1a1a",
                  borderRadius: "4px",
                  textDecoration: "none",
                  color: "#1a1a1a",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                <IconConsoleAlert size={18} /> Requests
              </Link>
            </div>

            <button
              onClick={() => {
                setMobileNavOpen(false);
                handleSignOut();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.75rem",
                borderRadius: "4px",
                background: "#fef2f2",
                border: "2px solid #dc2626",
                boxShadow: "2.5px 2.5px 0px #dc2626",
                color: "#dc2626",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                marginTop: "0.25rem"
              }}
            >
              ↩ Sign out from TeamUp
            </button>
          </div>
        </div>
      )}
    </>
  );
}
