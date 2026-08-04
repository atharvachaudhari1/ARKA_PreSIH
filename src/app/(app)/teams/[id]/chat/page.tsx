"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TeamChatPage() {
  const params = useParams();
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  if (loading) return (
    <div className="page-container" style={{ padding: "4rem 1.25rem", textAlign: "center" }}>
      <div style={{ height: 200, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#888" }}>
        [INITIALIZING SECURE COMMS...]
      </div>
    </div>
  );
  
  if (!isMember) return (
    <div className="page-container" style={{ padding: "4rem 1.25rem", textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ background: "#fef2f2", border: "2px solid #dc2626", boxShadow: "5px 5px 0px #dc2626", borderRadius: "6px", padding: "3rem 1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#dc2626", marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>ACCESS DENIED</h2>
        <p style={{ color: "#7f1d1d", marginBottom: "0", fontWeight: 600 }}>You do not have clearance to view this team&apos;s comms.</p>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.25rem", height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{
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
            boxShadow: "2px 2px 0px #5b5fc7"
          }}>
            $ TAIL -F ./TEAM_{params.id?.slice(0, 8)}_COMMS.LOG
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: 0 }}>
            Encrypted Comms
          </h1>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        background: "#f9f8f6", 
        border: "2px solid #1a1a1a", 
        boxShadow: "5px 5px 0px #1a1a1a", 
        borderRadius: "6px", 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden",
        marginBottom: "1rem"
      }}>
        {/* Chat Header */}
        <div style={{
          background: "#1a1a1a",
          color: "#ffffff",
          padding: "0.75rem 1.25rem",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 800,
          letterSpacing: "1px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #1a1a1a"
        }}>
          <span>STATUS: CONNECTED (SECURE)</span>
          <span style={{ color: "#10b981" }}>● LIVE</span>
        </div>

        {/* Message List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {messages.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#6b7280", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.85rem", opacity: 0.7 }}>
              [ NO TRANSMISSIONS DETECTED. INITIATE PROTOCOL. ]
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === currentUserId;
              const showName = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
              
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {showName && (
                    <span style={{ 
                      fontSize: "0.7rem", 
                      color: isMe ? "#5b5fc7" : "#4b5563", 
                      marginBottom: "0.2rem",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {isMe ? "YOU" : msg.sender?.name || "UNKNOWN_OPERATIVE"}
                    </span>
                  )}
                  <div style={{ 
                    background: isMe ? "#eef0ff" : "#ffffff", 
                    color: "#1a1a1a",
                    border: "2px solid #1a1a1a",
                    padding: "0.6rem 0.85rem", 
                    borderRadius: "4px",
                    boxShadow: isMe ? "2px 2px 0px #5b5fc7" : "2px 2px 0px #1a1a1a",
                    maxWidth: "75%",
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    lineHeight: 1.4,
                    wordBreak: "break-word"
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", gap: "0.75rem" }}>
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Transmit a message..."
          style={{ 
            flex: 1, 
            padding: "0.85rem 1rem", 
            fontFamily: "var(--font-sans)", 
            fontSize: "1rem",
            background: "#ffffff", 
            border: "2px solid #1a1a1a", 
            borderRadius: "4px", 
            boxShadow: "3px 3px 0px #1a1a1a",
            outline: "none"
          }}
        />
        <button 
          type="submit" 
          disabled={!input.trim()}
          style={{
            background: "#1a1a1a", 
            color: "#ffffff", 
            border: "2px solid #1a1a1a", 
            padding: "0 1.5rem", 
            fontFamily: "var(--font-mono)", 
            fontWeight: 800, 
            fontSize: "0.9rem",
            borderRadius: "4px", 
            boxShadow: "3px 3px 0px #5b5fc7", 
            cursor: !input.trim() ? "not-allowed" : "pointer", 
            transition: "all 0.15s ease",
            textTransform: "uppercase",
            opacity: !input.trim() ? 0.7 : 1
          }}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
