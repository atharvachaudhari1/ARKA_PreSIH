"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IconInbox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  );
}

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, isLoading: loading } = useSWR("/api/users/profile", fetcher);
  const profile = data?.profile || null;
  const hasTeam = profile?.team_memberships && profile.team_memberships.length > 0;

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 1000 }}>
      <div style={{ marginBottom: "3rem" }}>
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
          $ ./DASHBOARD_INIT.SH
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Welcome back, <span className="gradient-text">{profile?.name ? profile.name.split(" ")[0] : "Hacker"}</span>
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.3rem", fontSize: "0.95rem" }}>
          Here is an overview of your hackathon journey.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        
        {/* Quick Actions */}
        <div style={{ 
          background: "#ffffff", 
          border: "2px solid #1a1a1a", 
          boxShadow: "5px 5px 0px #1a1a1a", 
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex", 
          flexDirection: "column" 
        }}>
          {/* Terminal Header */}
          <div style={{
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "0.65rem 1.25rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            letterSpacing: "1px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #1a1a1a"
          }}>
            <span>$ ./QUICK_ACTIONS.SH</span>
          </div>
          
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/teams" style={{ 
              display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem",
              background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a",
              transition: "all 0.15s ease", color: "var(--text-primary)"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#5b5fc7"; e.currentTarget.style.boxShadow = "4px 4px 0px #5b5fc7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ color: "#1a1a1a" }}><IconSearch /></div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>Browse Teams</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Find a team looking for your skills</div>
              </div>
            </Link>

            {!hasTeam && (
              <Link href="/teams/create" style={{ 
                display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem",
                background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a",
                transition: "all 0.15s ease", color: "var(--text-primary)"
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#5b5fc7"; e.currentTarget.style.boxShadow = "4px 4px 0px #5b5fc7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ color: "#1a1a1a" }}><IconPlus /></div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>Create a Team</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>Start your own hackathon project</div>
                </div>
              </Link>
            )}

            <Link href="/requests" style={{ 
              display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem",
              background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", boxShadow: "2px 2px 0px #1a1a1a",
              transition: "all 0.15s ease", color: "var(--text-primary)"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#5b5fc7"; e.currentTarget.style.boxShadow = "4px 4px 0px #5b5fc7"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "#1a1a1a"; e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ color: "#1a1a1a" }}><IconInbox /></div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 800, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>Manage Requests</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>View join requests and invitations</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Status / Activity */}
        <div style={{ 
          background: "#ffffff", 
          border: "2px solid #1a1a1a", 
          boxShadow: "5px 5px 0px #1a1a1a", 
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex", 
          flexDirection: "column" 
        }}>
          {/* Terminal Header */}
          <div style={{
            background: "#1a1a1a",
            color: "#ffffff",
            padding: "0.65rem 1.25rem",
            fontSize: "0.8rem",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            letterSpacing: "1px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "2px solid #1a1a1a"
          }}>
            <span>$ ./STATUS_CHECK.SH</span>
          </div>
          
          <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
            {loading ? (
               <div style={{ height: 140, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontWeight: 700, color: "#888", fontSize: "0.9rem" }}>
                 [FETCHING MY STATUS...]
               </div>
            ) : profile?.led_teams?.length > 0 ? (
              <div style={{ background: "#eef0ff", border: "2px solid #1a1a1a", borderRadius: "4px", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", boxShadow: "inset 2px 2px 0px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem" }}>Leading: <span className="gradient-text">{profile.led_teams[0].name}</span></h3>
                <p style={{ fontSize: "0.9rem", color: "#5a5a5a", marginBottom: "1.5rem", fontWeight: 500 }}>Check your team page to manage members and update your requirements.</p>
                <Link href={`/teams/${profile.led_teams[0].id}`} style={{
                  background: "#5b5fc7", color: "#ffffff", border: "2px solid #1a1a1a", padding: "0.6rem 1.25rem",
                  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px",
                  borderRadius: "4px", boxShadow: "3px 3px 0px #1a1a1a", textDecoration: "none", transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translate(1px, 1px)"; e.currentTarget.style.boxShadow = "2px 2px 0px #1a1a1a"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0, 0)"; e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"; }}>
                  View My Team
                </Link>
              </div>
            ) : profile?.team_memberships?.length > 0 ? (
              <div style={{ background: "#f8f6f0", border: "2px solid #1a1a1a", borderRadius: "4px", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", boxShadow: "inset 2px 2px 0px rgba(0,0,0,0.05)" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem" }}>Team: <span className="gradient-text">{profile.team_memberships[0].team.name}</span></h3>
                <p style={{ fontSize: "0.9rem", color: "#5a5a5a", marginBottom: "1.5rem", fontWeight: 500 }}>Access your team dashboard to view members and chat.</p>
                <Link href={`/teams/${profile.team_memberships[0].team_id}`} style={{
                  background: "#1a1a1a", color: "#ffffff", border: "2px solid #1a1a1a", padding: "0.6rem 1.25rem",
                  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.5px",
                  borderRadius: "4px", boxShadow: "3px 3px 0px #5b5fc7", textDecoration: "none", transition: "all 0.15s ease"
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "translate(1px, 1px)"; e.currentTarget.style.boxShadow = "2px 2px 0px #5b5fc7"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0, 0)"; e.currentTarget.style.boxShadow = "3px 3px 0px #5b5fc7"; }}>
                  View My Team
                </Link>
              </div>
            ) : (
              <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: "4px", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", boxShadow: "inset 2px 2px 0px rgba(0,0,0,0.05)" }}>
                <div style={{ 
                  display: "inline-flex", alignItems: "center", gap: "0.6rem", 
                  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.9rem", 
                  background: "#1a1a1a", color: "#ffffff", padding: "0.5rem 1rem", 
                  borderRadius: "3px", letterSpacing: "0.5px", marginBottom: "1.5rem" 
                }}>
                  <span>STATUS: NO_TEAM_ASSIGNED</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", border: "2px solid #1a1a1a", boxShadow: "0 0 5px #ef4444" }} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem" }}>No active team</h3>
                <p style={{ fontSize: "0.9rem", color: "#5a5a5a", marginBottom: "0", fontWeight: 500 }}>You haven&apos;t joined a team yet. Create your own or browse open positions.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
