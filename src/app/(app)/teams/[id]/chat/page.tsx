"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TeamChatPage() {
  const params = useParams();
  const supabase = createClient();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isMember, setIsMember] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      // Get internal user id
      const resProfile = await fetch('/api/users/profile');
      if (resProfile.ok) {
        const { profile } = await resProfile.json();
        setCurrentUserId(profile.id);
      }

      // Fetch messages
      const resChat = await fetch(`/api/teams/${params.id}/chat`);
      if (resChat.ok) {
        const data = await resChat.json();
        setMessages(data.messages);
        setIsMember(true);
      } else {
        setIsMember(false);
      }
      setLoading(false);
    }
    init();
  }, [params.id]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isMember) return;
    
    // Subscribe to realtime messages on this team's chat
    const channel = supabase
      .channel(`room_team_${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `team_id=eq.${params.id}`
        },
        async (payload) => {
          // If we receive a message from someone else, we need their name
          // Since postgres_changes doesn't include joined tables, we might just fetch the message
          // Or optimistically just insert it if we are the sender
          
          if (payload.new.sender_id === currentUserId) return; // Handled optimistically
          
          // Re-fetch to get sender name, or we could just append with "Someone"
          const res = await fetch(`/api/teams/${params.id}/chat`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.id, isMember, currentUserId, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    setInput("");

    // Optimistic UI
    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      team_id: params.id,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      sender: { id: currentUserId, name: "You" }
    };
    setMessages(prev => [...prev, newMsg]);

    const res = await fetch(`/api/teams/${params.id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });

    if (!res.ok) {
      // Revert if failed
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      const data = await res.json();
      setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
    }
  }

  if (loading) return <div className="page-container" style={{ padding: "3rem" }}>Loading chat...</div>;
  if (!isMember) return <div className="page-container" style={{ padding: "3rem", color: "red" }}>Forbidden. You are not a member of this team.</div>;

  return (
    <div className="page-container" style={{ maxWidth: 800, padding: "1rem", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Team Chat</h1>
      </div>

      <div className="card" style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
        {messages.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", textAlign: "center", marginTop: "auto", marginBottom: "auto" }}>
            No messages yet. Say hi!
          </p>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                  {isMe ? "You" : msg.sender.name}
                </span>
                <div style={{ 
                  background: isMe ? "var(--gradient-brand)" : "var(--color-bg-elevated)", 
                  color: isMe ? "#fff" : "var(--color-text-primary)",
                  padding: "0.75rem 1rem", 
                  borderRadius: "var(--radius-md)",
                  maxWidth: "80%"
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem" }}>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="form-input"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
