import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  const events = await prisma.event.findMany({
    where: { is_active: true },
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { teams: true }
      }
    }
  });

  return (
    <div className="page-container" style={{ padding: "2rem 1.25rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", marginBottom: "0.5rem", fontFamily: "var(--font-sans)" }}>
          Active Hackathons & Events
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "1.05rem", fontWeight: 500, maxWidth: "600px", lineHeight: "1.5" }}>
          Browse ongoing hackathons. Form a squad or join an existing team participating in these events.
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{ padding: "3rem 1.5rem", background: "#ffffff", border: "2px dashed #1a1a1a", borderRadius: "8px", textAlign: "center", boxShadow: "4px 4px 0px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗓️</div>
          <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem" }}>No active events</h3>
          <p style={{ color: "#5a5a5a", fontSize: "1rem", maxWidth: "400px", margin: "0 auto" }}>
            There are no hackathons configured right now. Check back later!
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>
          {/* Timeline connecting line */}
          <div style={{ position: "absolute", left: "24px", top: "20px", bottom: "20px", width: "4px", background: "#1a1a1a", borderRadius: "4px", zIndex: 0 }} className="desktop-only"></div>

          {events.map((event, index) => (
            <div key={event.id} style={{ display: "flex", gap: "1.5rem", position: "relative", zIndex: 1 }}>
              {/* Timeline dot */}
              <div className="desktop-only" style={{ width: "20px", height: "20px", background: "#5b5fc7", border: "4px solid #1a1a1a", borderRadius: "50%", marginTop: "1.5rem", marginLeft: "16px", zIndex: 2, flexShrink: 0 }}></div>
              
              <div className="card" style={{ flex: 1, background: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "6px 6px 0px #1a1a1a", borderRadius: "8px", padding: "0" }}>
                <div style={{ 
                  background: "#1a1a1a", color: "#ffffff", padding: "0.75rem 1.5rem", 
                  fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "1px",
                  display: "flex", justifyContent: "space-between", alignItems: "center" 
                }}>
                  <span>EVENT // {event.id.slice(-6).toUpperCase()}</span>
                  {event.registration_deadline && (
                    <span style={{ color: "#d1fae5" }}>DEADLINE: {event.registration_deadline.toLocaleDateString()}</span>
                  )}
                </div>

                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div>
                      <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1a1a1a", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
                        {event.name}
                      </h2>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <span style={{ background: "#eef0ff", border: "1.5px solid #5b5fc7", color: "#1a1a1a", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                          SQUAD MAX: {event.team_size_max}
                        </span>
                        <span style={{ background: "#fef3c7", border: "1.5px solid #d97706", color: "#92400e", padding: "4px 10px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                          FEMALE QUOTA: {event.min_female_required}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ background: "#f8f6f0", border: "2px solid #1a1a1a", padding: "0.75rem 1.25rem", borderRadius: "6px", textAlign: "center", boxShadow: "inset 2px 2px 0px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>
                        {event._count.teams}
                      </div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#5a5a5a", marginTop: "0.25rem" }}>
                        TEAMS FORMED
                      </div>
                    </div>
                  </div>

                  {event.themes && event.themes.length > 0 && (
                    <div style={{ marginBottom: "1.5rem" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "#5a5a5a", marginBottom: "0.5rem" }}>
                        HACKATHON THEMES
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {event.themes.map((theme: string) => (
                          <span key={theme} style={{ background: "#f5f3ec", border: "1.5px solid #1a1a1a", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 700, color: "#1a1a1a" }}>
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "2px dashed #e5e5e5" }}>
                    <Link href={`/teams?event=${event.id}`} style={{
                      background: "#5b5fc7", color: "#ffffff", border: "2px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a",
                      padding: "0.75rem 1.5rem", borderRadius: "4px", fontWeight: 800, fontFamily: "var(--font-mono)",
                      textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease",
                      textTransform: "uppercase"
                    }}>
                      Browse Teams
                    </Link>
                    {authUser && (
                      <Link href={`/teams/create?event=${event.id}`} style={{
                        background: "#ffffff", color: "#1a1a1a", border: "2px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a",
                        padding: "0.75rem 1.5rem", borderRadius: "4px", fontWeight: 800, fontFamily: "var(--font-mono)",
                        textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease",
                        textTransform: "uppercase"
                      }}>
                        Create Squad
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
