"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
      
      const resProfile = await fetch('/api/users/profile');
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

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`user_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  async function markAsRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: "read" } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  function getNotificationText(notif: any) {
    switch (notif.type) {
      case "new_join_request": return `New join request for ${notif.payload.team_name}`;
      case "teammate_opinion_added": return `New opinion on applicant for ${notif.payload.team_name}`;
      case "leader_decision_made": return `Decision made on applicant for ${notif.payload.team_name}`;
      case "request_accepted": return `You were accepted into ${notif.payload.team_name}!`;
      case "request_rejected": return `Your request to ${notif.payload.team_name} was declined.`;
      case "request_expired_other_team_joined": return `Request expired because you joined a team.`;
      case "team_now_full": return `Request expired because ${notif.payload.team_name} is full.`;
      default: return "New notification";
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: "none", border: "none", color: "var(--color-text-secondary)",
          cursor: "pointer", position: "relative", padding: "0.5rem"
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0, background: "#ef4444", color: "white",
            fontSize: "0.6rem", fontWeight: 800, padding: "2px 5px", borderRadius: "10px"
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", top: "100%", right: 0, width: 320,
          background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
          zIndex: 50, maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "1rem", borderBottom: "1px solid var(--color-border)", fontWeight: 700 }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--color-text-muted)" }}>
              All caught up!
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => {
                  if (n.read_status === "unread") markAsRead(n.id);
                }}
                style={{
                  padding: "1rem", borderBottom: "1px solid var(--color-border)", cursor: "pointer",
                  background: n.read_status === "unread" ? "rgba(99,102,241,0.05)" : "transparent",
                  opacity: n.read_status === "unread" ? 1 : 0.6
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-primary)" }}>
                  {getNotificationText(n)}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
