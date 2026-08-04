import Link from "next/link";
import { Metadata } from "next";
import BrandLogo from "@/components/BrandLogo";
import { 
  IconTerminalPrompt, 
  IconDashboardGrid, 
  IconConsoleAlert, 
  IconSearchRadar,
  IconRocketDeploy 
} from "@/components/TerminalIcons";

export const metadata: Metadata = {
  title: "TeamUp — Find Your Hackathon Team",
  description:
    "The verified teammate-matching platform for Smart India Hackathon. Join a team or build one — all verified, all semi-anonymous.",
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3efe6",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-mono), monospace",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      <style>{`
        .btn-nav-login:hover { transform: translateY(-1px) !important; box-shadow: 3px 3px 0px #1a1a1a !important; background: #fff !important; }
        .btn-nav-start:hover { transform: translateY(-1px) !important; box-shadow: 3px 3px 0px #1a1a1a !important; background: #4a4fb5 !important; }
        .btn-hero-join:hover { transform: translateY(-2px) !important; box-shadow: 6px 6px 0px #1a1a1a !important; background: #4a4fb5 !important; }
        .btn-hero-create:hover { transform: translateY(-2px) !important; box-shadow: 6px 6px 0px #1a1a1a !important; background: #fff9c4 !important; }
      `}</style>
      {/* ─── Nav ─── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 1rem",
          borderBottom: "2px solid #1a1a1a",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#eae5dc",
          boxShadow: "0 2px 0 #1a1a1a",
          width: "100%",
          boxSizing: "border-box",
          flexWrap: "nowrap",
          gap: "0.5rem"
        }}
      >
        <div>
          <BrandLogo size="sm" />
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "nowrap" }}>
          <Link
            href="/login"
            className="btn-nav-login"
            style={{
              padding: "0.45rem 0.7rem",
              background: "#f7f4ee",
              border: "1.5px solid #1a1a1a",
              boxShadow: "2px 2px 0px #1a1a1a",
              borderRadius: "2px",
              fontWeight: 700,
              color: "#1a1a1a",
              textDecoration: "none",
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease",
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn-nav-start"
            style={{
              padding: "0.45rem 0.75rem",
              background: "#5b5fc7",
              border: "1.5px solid #1a1a1a",
              boxShadow: "2px 2px 0px #1a1a1a",
              borderRadius: "2px",
              fontWeight: 700,
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "0.8rem",
              whiteSpace: "nowrap",
              transition: "transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease",
            }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.25rem 4rem",
          maxWidth: "920px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(2.3rem, 6vw, 4.4rem)",
            fontWeight: 900,
            lineHeight: 1.12,
            marginBottom: "1.5rem",
            color: "#1a1a1a",
            letterSpacing: "-0.03em",
          }}
        >
          Stop broadcasting.{" "}
          <span
            style={{
              color: "#5b5fc7",
              textDecoration: "underline",
              textDecorationThickness: "5px",
              textUnderlineOffset: "6px",
            }}
          >
            Start matching.
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          style={{
            fontSize: "1.1rem",
            color: "#3d3d3d",
            maxWidth: "640px",
            marginBottom: "2.5rem",
            lineHeight: 1.7,
            fontWeight: 500,
          }}
        >
          Team hunting without the group chat cringe with TeamUp<br />
          Browse/Create teams, check the vibe, and apply!
        </p>

        {/* ─── Dual CTA — Devfolio-style ─── */}
        <div
          className="responsive-stack"
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            maxWidth: "540px",
          }}
        >
          <Link
            href="/signup?path=join"
            className="btn-mobile-full btn-hero-join"
            style={{
              flex: "1 1 220px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              padding: "0.85rem 1.25rem",
              minHeight: "50px",
              background: "#5b5fc7",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.98rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <IconDashboardGrid size={22} color="#ffffff" style={{ filter: "drop-shadow(1px 1px 0px #000)" }} />
            Join a Team
          </Link>
          <Link
            href="/signup?path=create"
            className="btn-mobile-full btn-hero-create"
            style={{
              flex: "1 1 220px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              padding: "0.85rem 1.25rem",
              minHeight: "50px",
              background: "#fffce8",
              color: "#1a1a1a",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.98rem",
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              transition: "all 0.15s ease",
            }}
          >
            <IconTerminalPrompt size={22} color="#5b5fc7" />
            Create a Team
          </Link>
        </div>

        {/* Trust line */}
        <div
          style={{
            marginTop: "2.5rem",
            padding: "0.6rem 1rem",
            background: "#eae5dc",
            border: "1.5px solid #1a1a1a",
            borderRadius: "4px",
            fontSize: "0.82rem",
            color: "#1a1a1a",
            fontWeight: 800,
            maxWidth: "100%",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}
        >
          <span>[ID VERIFIED SYSTEM]</span>
          <span>·</span>
          <span>[ZERO GUEST ACCESS]</span>
          <span>·</span>
          <span>[ENCRYPTED DOSSIERS]</span>
        </div>
      </section>

      {/* ─── Live stats bar ─── */}
      <section
        style={{
          borderTop: "2px solid #1a1a1a",
          borderBottom: "2px solid #1a1a1a",
          background: "#eae5dc",
          padding: "2.5rem 1.5rem",
          boxSizing: "border-box"
        }}
      >
        <div
          className="responsive-grid"
          style={{
            maxWidth: "1050px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {[
            { value: "—", label: "Teams open" },
            { value: "—", label: "Spots available" },
            { value: "—", label: "Members verified" },
            { value: "6", label: "Max team size (SIH)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#ffffff",
                border: "2px solid #1a1a1a",
                boxShadow: "4px 4px 0px #1a1a1a",
                borderRadius: "4px",
                padding: "1.5rem 1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "2.25rem",
                  fontWeight: 900,
                  color: "#5b5fc7",
                  marginBottom: "0.25rem",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#1a1a1a",
                  letterSpacing: "0.05em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section style={{ padding: "5rem 1.5rem", background: "#f3efe6", boxSizing: "border-box" }}>
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span
              style={{
                background: "#1a1a1a",
                color: "#fffce8",
                padding: "0.35rem 0.85rem",
                borderRadius: "3px",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-block",
                marginBottom: "0.75rem",
              }}
            >
              $ cat how-it-works.md
            </span>
            <h2
              style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: "#1a1a1a",
                margin: 0,
                marginBottom: "0.5rem"
              }}
            >
              Two paths. One platform.
            </h2>
            <p style={{
                color: "#5b5fc7",
                fontSize: "1.3rem",
                fontWeight: 800,
                margin: 0,
            }}>
              No awkwardness.
            </p>
          </div>

          <div
            className="responsive-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "2rem",
            }}
          >
            {/* Path A — Join */}
            <div
              style={{
                background: "#ffffff",
                border: "2.5px solid #1a1a1a",
                boxShadow: "6px 6px 0px #1a1a1a",
                borderRadius: "6px",
                padding: "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box"
              }}
            >
              <div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "4px",
                    background: "#eef0ff",
                    border: "2px solid #1a1a1a",
                    boxShadow: "3px 3px 0px #1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <IconDashboardGrid size={32} color="#5b5fc7" />
                </div>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    marginBottom: "0.75rem",
                    color: "#1a1a1a",
                  }}
                >
                  Looking to join?
                </h3>
                <p
                  style={{
                    color: "#4a4a4a",
                    lineHeight: 1.65,
                    marginBottom: "1.75rem",
                    fontSize: "0.98rem",
                  }}
                >
                  Browse verified teams. Check their roster. See if your skills match. 
                  Shoot your shot. Your stats stay private. They only drop for the 
                  teams you apply to.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Browse teams", "Filter by skill", "Private application"].map(
                  (t) => (
                    <span
                      key={t}
                      style={{
                        background: "#eae5dc",
                        border: "1.5px solid #1a1a1a",
                        boxShadow: "2px 2px 0px #1a1a1a",
                        borderRadius: "2px",
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Path B — Create */}
            <div
              style={{
                background: "#ffffff",
                border: "2.5px solid #1a1a1a",
                boxShadow: "6px 6px 0px #1a1a1a",
                borderRadius: "6px",
                padding: "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxSizing: "border-box"
              }}
            >
              <div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "4px",
                    background: "#fffce8",
                    border: "2px solid #1a1a1a",
                    boxShadow: "3px 3px 0px #1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.5rem",
                  }}
                >
                  <IconTerminalPrompt size={32} color="#5b5fc7" />
                </div>
                <h3
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    marginBottom: "0.75rem",
                    color: "#1a1a1a",
                  }}
                >
                  Building a team?
                </h3>
                <p
                  style={{
                    color: "#4a4a4a",
                    lineHeight: 1.65,
                    marginBottom: "1.75rem",
                    fontSize: "0.98rem",
                  }}
                >
                  Create a team. List the skills you need. Become the captain.
                  Scout for talent or let them slide into your queue. The crew votes 
                  on the vibe check. You get the final say.
                </p>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {["Team leader", "Skill matching", "Consensus voting"].map(
                  (t) => (
                    <span
                      key={t}
                      style={{
                        background: "#eae5dc",
                        border: "1.5px solid #1a1a1a",
                        boxShadow: "2px 2px 0px #1a1a1a",
                        borderRadius: "2px",
                        padding: "0.3rem 0.65rem",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#1a1a1a",
                      }}
                    >
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Transparency model explainer ─── */}
      <section
        style={{
          background: "#eae5dc",
          padding: "5rem 1.5rem",
          borderTop: "2px solid #1a1a1a",
          borderBottom: "2px solid #1a1a1a",
          boxSizing: "border-box"
        }}
      >
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span
              style={{
                background: "#1a1a1a",
                color: "#fffce8",
                padding: "0.35rem 0.85rem",
                borderRadius: "3px",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-block",
                marginBottom: "0.75rem",
              }}
            >
              $ cat transparency.md
            </span>
            <h2
              style={{
                fontSize: "2.2rem",
                fontWeight: 900,
                color: "#1a1a1a",
                marginBottom: "0.75rem",
              }}
            >
              Semi-anonymous by design
            </h2>
            <p
              style={{
                color: "#4a4a4a",
                fontSize: "1.02rem",
                fontWeight: 500,
              }}
            >
              You can verify a team&apos;s credibility before applying. They can&apos;t see
              who else you&apos;re applying to.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              {
                icon: <IconDashboardGrid size={24} color="#5b5fc7" />,
                label: "Team structure",
                desc: "The vibe check. Skills needed, open spots, and the domain are visible to everyone.",
              },
              {
                icon: <IconTerminalPrompt size={24} color="#5b5fc7" />,
                label: "Leader identity",
                desc: "No catfishes here. The captain's name, phone, and LinkedIn are public so you know they are legit.",
              },
              {
                icon: <IconSearchRadar size={24} color="#5b5fc7" />,
                label: "Existing members",
                desc: "See who you are working with. Names, departments, and skills are public. Contact info stays strictly private.",
              },
              {
                icon: <IconConsoleAlert size={24} color="#5b5fc7" />,
                label: "Your application",
                desc: "No oversharing. Your full profile drops only for the specific team you apply to.",
              },
              {
                icon: <IconConsoleAlert size={24} color="#5b5fc7" />,
                label: "Your other applications",
                desc: "Keep your options open. Teams will never know who else you are sliding in with.",
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  background: "#ffffff",
                  border: "2px solid #1a1a1a",
                  boxShadow: "4px 4px 0px #1a1a1a",
                  borderRadius: "4px",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                  boxSizing: "border-box"
                }}
              >
                <div style={{ flexShrink: 0, marginTop: "2px" }}>
                  {row.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#1a1a1a", marginBottom: "0.2rem" }}>
                    {row.label}
                  </div>
                  <div
                    style={{
                      color: "#4a4a4a",
                      fontSize: "0.92rem",
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    {row.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section
        style={{
          padding: "5rem 1.25rem",
          textAlign: "center",
          background: "#f3efe6",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            maxWidth: "740px",
            margin: "0 auto",
            background: "#fffce8",
            border: "2.5px solid #1a1a1a",
            boxShadow: "6px 6px 0px #1a1a1a",
            borderRadius: "6px",
            padding: "3rem 1.5rem",
            boxSizing: "border-box"
          }}
        >
          <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "1rem", color: "#1a1a1a" }}>
            Ready? Your team is waiting.
          </h2>
          <p
            style={{
              color: "#3a3a3a",
              marginBottom: "2.25rem",
              fontSize: "1rem",
              fontWeight: 500,
              maxWidth: "520px",
              margin: "0 auto 2.25rem",
            }}
          >
            Sign up in 60 seconds. Verified. No spam. No public profiles until you
            choose.
          </p>
          <Link
            href="/signup"
            className="btn-mobile-full"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              padding: "0.95rem 2rem",
              background: "#5b5fc7",
              color: "#ffffff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px #1a1a1a",
              borderRadius: "4px",
              fontWeight: 900,
              fontSize: "1.05rem",
              textDecoration: "none",
              minHeight: "44px"
            }}
          >
            <IconRocketDeploy size={22} color="#ffffff" style={{ filter: "drop-shadow(1px 1px 0px #000)" }} />
            Create your account ➔
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          borderTop: "2px solid #1a1a1a",
          padding: "2rem 1.5rem",
          textAlign: "center",
          background: "#eae5dc",
          color: "#4a4a4a",
          fontSize: "0.8rem",
          boxSizing: "border-box"
        }}
      >
        <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <BrandLogo size="md" />
          </div>
          <p style={{ fontWeight: 600 }}>
            Built for SIH 2026 · Semi-anonymous team matching · All verified
          </p>
        </div>
      </footer>
    </main>
  );
}
