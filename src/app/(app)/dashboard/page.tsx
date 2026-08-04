"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: 1000 }}>
      <div style={{ marginBottom: "3rem" }}>
        <p className="section-title" style={{ marginBottom: "0.4rem" }}>Home</p>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Welcome back, <span className="gradient-text">{profile?.name ? profile.name.split(" ")[0] : "Hacker"}</span>
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginTop: "0.3rem", fontSize: "0.95rem" }}>
          Here is an overview of your hackathon journey.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        
        {/* Quick Actions */}
        <div className="card" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link href="/teams" className="btn btn-secondary" style={{ display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem" }}>
              <div style={{ color: "var(--ember-peach)" }}><IconSearch /></div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Browse Teams</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 400 }}>Find a team looking for your skills</div>
              </div>
            </Link>

            <Link href="/teams/create" className="btn btn-secondary" style={{ display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem" }}>
              <div style={{ color: "var(--ember-coral)" }}><IconPlus /></div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Create a Team</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 400 }}>Start your own hackathon project</div>
              </div>
            </Link>

            <Link href="/requests" className="btn btn-secondary" style={{ display: "flex", justifyContent: "flex-start", padding: "1rem", textDecoration: "none", gap: "1rem" }}>
              <div style={{ color: "#3b82f6" }}><IconInbox /></div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Manage Requests</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: 400 }}>View join requests and invitations</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Status / Activity */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>My Status</h2>
          
          {loading ? (
             <div className="skeleton" style={{ height: 100, borderRadius: "var(--radius-md)" }} />
          ) : profile?.led_teams?.length > 0 ? (
            <div style={{ background: "rgba(246,70,104,0.05)", border: "1px solid rgba(246,70,104,0.15)", borderRadius: "var(--radius-md)", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--ember-peach)", marginBottom: "0.5rem" }}>You are leading a team!</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>Check your team page to manage members and update your requirements.</p>
              <Link href={`/teams/${profile.led_teams[0].id}`} className="btn btn-primary btn-sm">
                View My Team
              </Link>
            </div>
          ) : (
            <div style={{ background: "var(--color-bg-elevated)", border: "1px dashed var(--color-border-hover)", borderRadius: "var(--radius-md)", padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "0.5rem" }}>No active team</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>You haven't joined a team yet. Create your own or browse open positions.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
