"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationCenter from "./NotificationCenter";
import BrandLogo from "./BrandLogo";
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

export default function AppNavbar({ userEmail, isAdmin = false, hasTeam = false }: { userEmail: string, isAdmin?: boolean, hasTeam?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [hasUnreadRequests, setHasUnreadRequests] = useState(false);

  useEffect(() => {
    async function fetchCounts() {
      // Fire both in parallel — no sequential dependency
      const [notifRes, reqRes] = await Promise.all([
        fetch("/api/notifications"),
        fetch("/api/join-requests"),
      ]);

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        const hasUnread = notifData.notifications?.some((n: any) => n.read_status === "unread");
        setHasUnreadAlerts(hasUnread);
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        const hasPendingMy = reqData.myRequests?.some((r: any) => r.status === "pending" && r.direction === "team_to_user");
        const hasPendingTeam = reqData.teamRequests?.some((r: any) => r.status === "pending" && r.direction === "user_to_team");
        setHasUnreadRequests(hasPendingMy || hasPendingTeam);
      }
    }
    fetchCounts();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
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
          <BrandLogo size="sm" />
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
                  color: active ? "#5b5fc7" : "#1a1a1a",
                  background: active ? "#eef0ff" : "transparent",
                  border: active ? "2px solid #5b5fc7" : "2px solid transparent",
                  boxShadow: active ? "3px 3px 0px #5b5fc7" : "none",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "#eef0ff";
                    e.currentTarget.style.border = "2px solid #5b5fc7";
                    e.currentTarget.style.boxShadow = "3px 3px 0px #5b5fc7";
                    e.currentTarget.style.color = "#5b5fc7";
                  }
                }}
                onMouseOut={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "2px solid transparent";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.color = "#1a1a1a";
                  }
                }}
              >
                <span style={{ display: "flex", alignItems: "center", position: "relative" }}>
                  {link.icon}
                  {((link.label === "Alerts" && hasUnreadAlerts) || (link.label === "Requests" && hasUnreadRequests)) && (
                    <span style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: link.label === "Alerts" ? "#d97706" : "#5b5fc7",
                      border: `2px solid ${active ? "#eef0ff" : "#ffffff"}`,
                      boxSizing: "content-box"
                    }} />
                  )}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <NotificationCenter />

          {/* Desktop Create Button */}
          {!hasTeam && (
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
              onMouseOver={(e) => { e.currentTarget.style.background = "#4a4fb5"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "4px 4px 0px #1a1a1a"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "#5b5fc7"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; }}
            >
              <IconRocketDeploy size={18} color="#ffffff" style={{ filter: "drop-shadow(1px 1px 0px #000)" }} />
              Create Team
            </Link>
          )}

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
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#5b5fc7"; e.currentTarget.style.boxShadow = "3px 3px 0px #5b5fc7"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}
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
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "4px",
                        textDecoration: "none",
                        color: "#ef4444",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      <IconConsoleAlert size={18} /> Admin Panel
                    </Link>
                  )}
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
          <button
            className="mobile-only"
            onClick={() => setProfileOpen((o) => !o)}
            style={{
              background: "transparent",
              border: "none",
              color: "#1a1a1a",
              cursor: "pointer",
              padding: "0.2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "#1a1a1a", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem",
              fontWeight: 800, fontFamily: "var(--font-mono)", border: "2px solid #1a1a1a"
            }}>
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div 
        className="mobile-only"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "#ffffff",
          borderTop: "3px solid #1a1a1a",
          boxShadow: "0 -4px 10px rgba(0,0,0,0.05)",
          zIndex: 49,
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          height: "65px",
          paddingBottom: "env(safe-area-inset-bottom)"
        }}
      >
        {NAV_LINKS.filter(l => l.label !== "Alerts").map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.2rem",
                textDecoration: "none",
                color: active ? "#5b5fc7" : "#5a5a5a",
                width: "60px",
                height: "100%",
                position: "relative"
              }}
            >
              <div style={{ 
                background: active ? "#eef0ff" : "transparent",
                padding: "0.3rem 1rem",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
                border: active ? "2px solid #5b5fc7" : "2px solid transparent",
                boxShadow: active ? "1.5px 1.5px 0px #5b5fc7" : "none"
              }}>
                {link.icon}
                {link.label === "Requests" && hasUnreadRequests && (
                  <span style={{
                    position: "absolute", top: "8px", right: "12px", width: 8, height: 8,
                    borderRadius: "50%", background: "#5b5fc7", border: "2px solid #fff"
                  }} />
                )}
              </div>
              <span style={{ fontSize: "0.6rem", fontWeight: active ? 800 : 600, fontFamily: "var(--font-mono)" }}>
                {link.label}
              </span>
            </Link>
          );
        })}
        
        <Link
          href="/teams/create"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.2rem",
            textDecoration: "none",
            color: pathname === "/teams/create" ? "#5b5fc7" : "#5a5a5a",
            width: "60px",
            height: "100%"
          }}
        >
          <div style={{ 
            background: pathname === "/teams/create" ? "#eef0ff" : "transparent",
            padding: "0.3rem 1rem",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
            border: pathname === "/teams/create" ? "2px solid #5b5fc7" : "2px solid transparent",
            boxShadow: pathname === "/teams/create" ? "1.5px 1.5px 0px #5b5fc7" : "none"
          }}>
            <IconRocketDeploy size={20} />
          </div>
          <span style={{ fontSize: "0.6rem", fontWeight: pathname === "/teams/create" ? 800 : 600, fontFamily: "var(--font-mono)" }}>
            Create
          </span>
        </Link>
      </div>

      {/* Mobile Profile Slide-up/Dropdown */}
      {profileOpen && (
        <>
          <div 
            className="mobile-only"
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.3)" }}
            onClick={() => setProfileOpen(false)}
          />
          <div 
            className="mobile-only"
            style={{
              position: "fixed",
              bottom: "75px",
              right: "10px",
              width: "200px",
              background: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "5px 5px 0px #1a1a1a",
              borderRadius: "6px",
              padding: "1rem",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem"
            }}
          >
            <div style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#777", letterSpacing: "1px", marginBottom: "0.5rem" }}>
              [USER DOSSIER]
              <br/>{userEmail}
            </div>
            
            <Link
              href="/profile"
              onClick={() => setProfileOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem",
                background: "#fdfbf7", border: "1.5px solid #1a1a1a", borderRadius: "4px",
                textDecoration: "none", color: "#1a1a1a", fontWeight: 700, fontSize: "0.85rem"
              }}
            >
              <IconSquadUsers size={16} /> Profile
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem",
                  background: "#fee2e2", border: "1.5px solid #ef4444", borderRadius: "4px",
                  textDecoration: "none", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem"
                }}
              >
                <IconConsoleAlert size={16} /> Admin
              </Link>
            )}
            
            <button
              onClick={() => {
                setProfileOpen(false);
                handleSignOut();
              }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem",
                background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: "4px",
                color: "#dc2626", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                marginTop: "0.5rem"
              }}
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </>
  );
}
