"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HackersPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: profileData } = useSWR('/api/users/profile', fetcher);
  const { data: hackersData, isLoading: loading } = useSWR('/api/hackers', fetcher, { keepPreviousData: true });

  const ledTeamId = profileData?.profile?.led_teams?.[0]?.id || null;
  const hackers = hackersData?.hackers || [];

  async function handleInvite(hackerId: string) {
    if (!ledTeamId) return;
    setInvitingId(hackerId);
    
    try {
      const res = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: ledTeamId, requester_id: hackerId, direction: 'team_to_user' })
      });
      
      if (res.ok) {
        toast('Invite sent successfully!', 'success');
      } else {
        const errorData = await res.json();
        toast(`Error: ${errorData.error}`, 'error');
      }
    } catch (e) {
      toast('An error occurred while sending the invite.', 'error');
    }
    setInvitingId(null);
  }

  const filteredHackers = hackers.filter((h: any) => 
    !searchQuery || h.skills.some((s: any) => s.skill.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 1000, paddingBottom: "100px" }}>
      <div style={{ marginBottom: "2.5rem" }}>
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
          $ ./FIND_TALENT.SH
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: 0 }}>
          Solo Hackers
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.95rem", fontWeight: 500, marginTop: "0.5rem" }}>
          Browse unassigned participants and recruit them to your team.
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <input 
          type="text" 
          placeholder="Filter by skill (e.g., React, Figma)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            width: "100%", maxWidth: 400, padding: "0.75rem 1rem", 
            border: "2px solid #1a1a1a", borderRadius: "4px", 
            boxShadow: "3px 3px 0px #1a1a1a", fontFamily: "var(--font-sans)", 
            fontWeight: 600, fontSize: "0.95rem", outline: "none" 
          }}
        />
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 150, borderRadius: "6px" }} />
      ) : filteredHackers.length === 0 ? (
        <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "5px 5px 0px #1a1a1a", padding: "3rem 2rem", textAlign: "center", borderRadius: "6px" }}>
          <h3 style={{ fontSize: "1.25rem", color: "#1a1a1a", fontWeight: 800 }}>No hackers found</h3>
          <p style={{ color: "#5a5a5a" }}>Everyone seems to be in a team!</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {filteredHackers.map((hacker: any) => (
            <div key={hacker.id} style={{ 
              background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a", 
              borderRadius: "6px", display: "flex", flexDirection: "column"
            }}>
              <div style={{ padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", margin: "0 0 0.2rem" }}>{hacker.name}</h3>
                <p style={{ color: "#5a5a5a", fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", margin: "0 0 1rem" }}>
                  🎓 {hacker.department} • 👤 {hacker.gender}
                </p>
                
                {hacker.bio && (
                  <p style={{ fontSize: "0.9rem", color: "#444", marginBottom: "1rem", fontStyle: "italic" }}>
                    &quot;{hacker.bio}&quot;
                  </p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                  {hacker.skills.map((s: any) => (
                    <span key={s.skill} style={{ 
                      background: "#fdfbf7", border: "1.5px solid #1a1a1a", 
                      padding: "3px 8px", borderRadius: "3px", fontSize: "0.75rem", 
                      fontWeight: 700, fontFamily: "var(--font-mono)" 
                    }}>
                      ⚡ {s.skill}
                    </span>
                  ))}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>
                  <span>Hackathons: {hacker.past_hackathons_count}</span>
                  <span>Soft Skills: {hacker.presentation_skill_rating}/5</span>
                </div>
              </div>
              
              <div style={{ borderTop: "2px solid #1a1a1a", padding: "1rem", background: "#fdfbf7", marginTop: "auto" }}>
                {ledTeamId ? (
                  <button 
                    onClick={() => handleInvite(hacker.id)}
                    disabled={invitingId === hacker.id}
                    style={{
                      width: "100%", background: "#1a1a1a", color: "#ffffff", border: "2px solid #1a1a1a",
                      padding: "0.6rem 1rem", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem",
                      borderRadius: "4px", boxShadow: "3px 3px 0px #5b5fc7", cursor: invitingId === hacker.id ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease", textTransform: "uppercase"
                    }}
                  >
                    {invitingId === hacker.id ? "INVITING..." : "INVITE TO TEAM"}
                  </button>
                ) : (
                  <div style={{ textAlign: "center", fontSize: "0.8rem", color: "#666", fontWeight: 600 }}>
                    You must lead a team to send invites.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
