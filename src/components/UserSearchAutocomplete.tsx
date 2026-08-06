"use client";

import { useState, useEffect, useRef } from "react";
import { IconSearchRadar } from "@/components/TerminalIcons";

interface User {
  id: string;
  name: string;
  email: string;
  department?: string;
  college?: string;
}

export function UserSearchAutocomplete({ onSelect }: { onSelect: (user: User) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
          setOpen(true);
        }
      } catch (err) {
        console.error("Search error", err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search by name or email..."
          style={{
            border: "2px solid #1a1a1a",
            borderRadius: "4px",
            padding: "0.65rem 0.85rem 0.65rem 2.2rem",
            background: "#fdfbfa",
            color: "#1a1a1a",
            fontWeight: 700,
            fontSize: "0.95rem",
            width: "100%",
            boxSizing: "border-box",
            minHeight: "44px",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        />
        <div style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "#666" }}>
          <IconSearchRadar size={16} color="#666" />
        </div>
      </div>
      
      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          boxShadow: "3px 3px 0px #1a1a1a",
          zIndex: 50,
          maxHeight: "200px",
          overflowY: "auto",
        }}>
          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => {
                onSelect(user);
                setQuery("");
                setOpen(false);
              }}
              style={{
                padding: "0.5rem 0.75rem",
                cursor: "pointer",
                borderBottom: "1px solid #eae5dc",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#f3efe6"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#1a1a1a" }}>{user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#666", fontWeight: 600 }}>{user.email}</div>
            </div>
          ))}
        </div>
      )}
      
      {open && !loading && results.length === 0 && query.trim().length >= 2 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          boxShadow: "3px 3px 0px #1a1a1a",
          zIndex: 50,
          padding: "1rem",
          textAlign: "center",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#dc2626"
        }}>
          No verified users found.
        </div>
      )}
    </div>
  );
}
