"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { isOutcomeNotificationType } from "@/lib/notificationOutcome";
import Link from "next/link";

type NotificationType =
  | "new_join_request"
  | "teammate_opinion_added"
  | "leader_decision_made"
  | "request_accepted"
  | "request_rejected"
  | "request_expired_other_team_joined"
  | "team_now_full"
  | "team_dissolved";

interface Notification {
  id: string;
  type: NotificationType;
  payload: Record<string, any>;
  read_status: "unread" | "read";
  created_at: string;
  team_id?: string | null;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; label: string; color: string; bg: string; border: string }
> = {
  new_join_request: {
    icon: "📥",
    label: "NEW APPLICATION",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#3b82f6",
  },
  teammate_opinion_added: {
    icon: "🗳️",
    label: "TEAMMATE VOTE",
    color: "#6d28d9",
    bg: "#f5f3ff",
    border: "#8b5cf6",
  },
  leader_decision_made: {
    icon: "⚡",
    label: "LEADER DECIDED",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#f59e0b",
  },
  request_accepted: {
    icon: "✅",
    label: "REQUEST ACCEPTED",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#10b981",
  },
  request_rejected: {
    icon: "❌",
    label: "REQUEST REJECTED",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#ef4444",
  },
  request_expired_other_team_joined: {
    icon: "⏳",
    label: "REQUEST EXPIRED",
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#9ca3af",
  },
  team_now_full: {
    icon: "🔒",
    label: "TEAM FULL",
    color: "#1a1a1a",
    bg: "#f5f3ec",
    border: "#1a1a1a",
  },
  team_dissolved: {
    icon: "🚫",
    label: "TEAM DISSOLVED",
    color: "#7c2d12",
    bg: "#fff7ed",
    border: "#ea580c",
  },
};

function getPayloadMessage(type: NotificationType, payload: Record<string, any>): string {
  switch (type) {
    case "new_join_request":
      return `${payload.requester_name ?? "Someone"} applied to join your team "${payload.team_name ?? ""}"`;
    case "teammate_opinion_added":
      return `${payload.voter_name ?? "A teammate"} voted ${payload.opinion ?? ""} on ${payload.requester_name ?? "an applicant"}'s request`;
    case "leader_decision_made":
      return `The leader has made a decision on ${payload.requester_name ?? "an applicant"}'s request`;
    case "request_accepted":
      return `You were accepted into team "${payload.team_name ?? ""}"! Welcome aboard.`;
    case "request_rejected":
      return `Your application to "${payload.team_name ?? ""}" was not accepted this time.`;
    case "request_expired_other_team_joined":
      return `Your pending request to "${payload.team_name ?? ""}" expired because you joined another team.`;
    case "team_now_full":
      return `Team "${payload.team_name ?? ""}" is now at full capacity.`;
    case "team_dissolved":
      return `Team "${payload.team_name ?? ""}" was dissolved by the leader. You are now free to join or create another team.`;
    default:
      return "You have a new notification.";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NotificationsPage() {
  const [markingAll, setMarkingAll] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { data, isLoading: loading, mutate: mutateNotifications } = useSWR('/api/notifications', fetcher);
  const notifications: Notification[] = data?.notifications || [];

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId || cancelled) return;

      const channel = supabase.channel(`user_notifs_${userId}`, {
        config: { broadcast: { self: false } },
      });

      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => {
          if (!cancelled) mutateNotifications();
        }
      );

      channel.subscribe();
      channelRef.current = channel;
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [mutateNotifications]);

  async function markAsRead(id: string) {
    const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    if (res.ok) {
      mutateNotifications();
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
    if (res.ok) {
      mutateNotifications();
    }
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter((n) => n.read_status === "unread").length;
  const unread = notifications.filter((n) => n.read_status === "unread");
  const read = notifications.filter(
    (n) => n.read_status === "read" && !isOutcomeNotificationType(n.type)
  );

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 860, margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-block",
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "0.35rem 0.85rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            borderRadius: "3px",
            marginBottom: "0.75rem",
            letterSpacing: "1px",
            boxShadow: "2px 2px 0px #5b5fc7",
          }}
        >
          {">"} SYSTEM.NOTIFICATIONS
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: "#1a1a1a",
                letterSpacing: "-0.03em",
                margin: 0,
              }}
            >
              Notification Feed
            </h1>
            {!loading && (
              <p
                style={{
                  color: "#5a5a5a",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  margin: "0.35rem 0 0",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {unreadCount > 0
                  ? `[ ${unreadCount} UNREAD SIGNAL${unreadCount > 1 ? "S" : ""} ]`
                  : "[ ALL CLEAR // NO UNREAD SIGNALS ]"}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              style={{
                background: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "3px 3px 0px #1a1a1a",
                padding: "0.6rem 1.25rem",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: "0.8rem",
                cursor: "pointer",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#5b5fc7";
                e.currentTarget.style.boxShadow = "4px 4px 0px #5b5fc7";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#1a1a1a";
                e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ✓ Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div
          style={{
            height: 200,
            background: "#f5f3ec",
            border: "2px dashed #1a1a1a",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color: "#888",
            fontSize: "0.9rem",
          }}
        >
          [SCANNING NOTIFICATION FEED...]
        </div>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #1a1a1a",
            boxShadow: "5px 5px 0px #1a1a1a",
            borderRadius: "8px",
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📭</div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 900,
              color: "#1a1a1a",
              marginBottom: "0.5rem",
            }}
          >
            All Clear
          </h3>
          <p
            style={{
              color: "#5a5a5a",
              fontSize: "1rem",
              maxWidth: "420px",
              margin: "0 auto 1.5rem",
            }}
          >
            No signals detected in your notification feed. Activity will appear here as your
            team interactions unfold.
          </p>
          <Link
            href="/teams"
            style={{
              background: "#5b5fc7",
              color: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "3px 3px 0px #1a1a1a",
              padding: "0.75rem 1.5rem",
              borderRadius: "4px",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              textDecoration: "none",
              display: "inline-block",
              textTransform: "uppercase",
              fontSize: "0.85rem",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#4a4fb5"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "4px 4px 0px #1a1a1a"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#5b5fc7"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; }}
          >
            Browse Teams
          </Link>
        </div>
      )}

      {/* Unread Notifications */}
      {!loading && unread.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: "#1a1a1a",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
              paddingLeft: "2px",
            }}
          >
            ● UNREAD ({unread.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {unread.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={() => markAsRead(n.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      {!loading && read.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: "#888",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
              paddingLeft: "2px",
            }}
          >
            ○ READ ({read.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {read.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={() => {}} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.team_now_full;
  const isUnread = notification.read_status === "unread";

  return (
    <div
      style={{
        background: isUnread ? cfg.bg : "#ffffff",
        border: `2px solid ${isUnread ? cfg.border : "#1a1a1a"}`,
        boxShadow: isUnread ? `4px 4px 0px ${cfg.border}` : "4px 4px 0px #1a1a1a",
        borderRadius: "6px",
        padding: "1.1rem 1.25rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
        transition: "all 0.15s ease",
        position: "relative",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translate(-2px, -2px)";
        e.currentTarget.style.boxShadow = isUnread ? `6px 6px 0px ${cfg.border}` : "6px 6px 0px #1a1a1a";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translate(0px, 0px)";
        e.currentTarget.style.boxShadow = isUnread ? `4px 4px 0px ${cfg.border}` : "4px 4px 0px #1a1a1a";
      }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: cfg.color,
            border: "2px solid #ffffff",
            boxShadow: `0 0 6px ${cfg.color}55`,
          }}
        />
      )}

      {/* Icon */}
      <div
        style={{
          fontSize: "1.5rem",
          flexShrink: 0,
          width: 44,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUnread ? cfg.bg : "#ffffff",
          border: "2px solid #1a1a1a",
          borderRadius: "4px",
          boxShadow: "2px 2px 0px #1a1a1a",
        }}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "0.7rem",
            fontWeight: 800,
            fontFamily: "var(--font-mono)",
            color: cfg.color,
            letterSpacing: "1px",
            marginBottom: "0.3rem",
            textTransform: "uppercase",
          }}
        >
          {cfg.label}
        </div>
        <p
          style={{
            fontSize: "0.95rem",
            fontWeight: isUnread ? 700 : 500,
            color: "#1a1a1a",
            margin: "0 0 0.5rem",
            lineHeight: 1.4,
          }}
        >
          {getPayloadMessage(notification.type, notification.payload as Record<string, any>)}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "#888",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
            }}
          >
            {timeAgo(notification.created_at)}
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {notification.team_id && (
              <Link
                href={`/teams/${notification.team_id}`}
                style={{
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  background: "#5b5fc7",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  textDecoration: "none",
                  border: "2px solid #1a1a1a",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  display: "inline-block",
                  boxShadow: "2px 2px 0px #1a1a1a",
                  transition: "all 0.15s ease",
                  textTransform: "uppercase"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translate(-1px, -1px)";
                  e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a";
                  e.currentTarget.style.background = "#4a4fb5";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translate(0px, 0px)";
                  e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a";
                  e.currentTarget.style.background = "#5b5fc7";
                }}
              >
                → VIEW TEAM
              </Link>
            )}
            {isUnread && (
              <button
                onClick={onMarkRead}
                style={{
                  fontSize: "0.75rem",
                  color: "#1a1a1a",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  background: "#ffffff",
                  border: "2px solid #1a1a1a",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  boxShadow: "2px 2px 0px #1a1a1a",
                  transition: "all 0.15s ease",
                  textTransform: "uppercase"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translate(-1px, -1px)";
                  e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a";
                  e.currentTarget.style.background = "#f5f5f5";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translate(0px, 0px)";
                  e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                ✓ Mark Read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
