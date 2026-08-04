"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";
import { IconSignal } from "@/components/TerminalIcons";

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function NotificationCenter() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const resProfile = await fetch("/api/users/profile");
      if (resProfile.ok) {
        const { profile } = await resProfile.json();
        setCurrentUserId(profile.id);
      }
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: any) => n.read_status === "unread").length);
      }
    }
    init();
  }, [supabase.auth]);

  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`user_${currentUserId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
        setUnreadCount((prev) => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, supabase]);

  async function markAsRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_status: "read" } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => n.read_status === "unread");
    await Promise.all(unread.map((n) => fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" })));
    setNotifications((prev) => prev.map((n) => ({ ...n, read_status: "read" })));
    setUnreadCount(0);
  }

  function getNotificationText(notif: any) {
    switch (notif.type) {
      case "new_join_request":                  return `New join request for ${notif.payload?.team_name ?? "your team"}`;
      case "teammate_opinion_added":            return `New opinion on applicant for ${notif.payload?.team_name ?? "your team"}`;
      case "leader_decision_made":              return `Decision made on applicant for ${notif.payload?.team_name ?? "your team"}`;
      case "request_accepted":                  return `You were accepted into ${notif.payload?.team_name ?? "a team"}!`;
      case "request_rejected":                  return `Your request to ${notif.payload?.team_name ?? "a team"} was declined.`;
      case "request_expired_other_team_joined": return "Request expired — you joined another team.";
      case "team_now_full":                     return `Request expired — ${notif.payload?.team_name ?? "team"} is now full.`;
      default: return "New notification";
    }
  }

  function getNotifIcon(type: string) {
    if (type === "request_accepted") return "✓";
    if (type === "request_rejected" || type.includes("expired") || type.includes("full")) return "✕";
    if (type === "new_join_request") return "→";
    return "·";
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative", background: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          color: "var(--color-text-secondary)",
          cursor: "pointer", padding: "0.45rem 0.65rem",
          display: "flex", alignItems: "center",
          transition: "all 0.15s ease",
        }}
        aria-label="Notifications"
      >
        <IconBell />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "var(--ember-coral)", color: "white",
            fontSize: "0.6rem", fontWeight: 800, padding: "2px 5px",
            borderRadius: "var(--radius-full)", minWidth: 18, textAlign: "center",
            boxShadow: "0 0 8px rgba(246,70,104,0.5)",
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, width: 330,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-hover)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 50, maxHeight: 420, display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--ember-peach)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem",
                }}>
                  <IconCheck /> Mark all read
                </button>
              )}
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "3.5rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <IconSignal size={42} color="var(--color-text-secondary)" />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "0.25rem", fontFamily: "var(--font-mono)" }}>
                    All caught up!
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", fontWeight: 500, margin: 0 }}>
                    No new signals detected.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} onClick={() => { if (n.read_status === "unread") markAsRead(n.id); }}
                    style={{
                      padding: "0.85rem 1rem",
                      borderBottom: "1px solid var(--color-border)",
                      cursor: "pointer",
                      background: n.read_status === "unread" ? "rgba(246,70,104,0.05)" : "transparent",
                      display: "flex", gap: "0.75rem", alignItems: "flex-start",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: n.read_status === "unread" ? "rgba(246,70,104,0.15)" : "var(--color-bg-card)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.7rem", fontWeight: 800,
                      color: n.read_status === "unread" ? "var(--ember-coral)" : "var(--color-text-muted)",
                    }}>
                      {getNotifIcon(n.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.84rem", color: n.read_status === "unread" ? "var(--color-text-primary)" : "var(--color-text-secondary)", lineHeight: 1.4 }}>
                        {getNotificationText(n)}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {n.read_status === "unread" && (
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ember-coral)", flexShrink: 0, marginTop: 6 }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
