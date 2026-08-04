import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-container">
      {/* ── Top Navigation Bar ── */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b-2 border-stone-400">
        <Link href="/" className="logo">
          <span className="logo-bracket">{"<"}</span>
          <span>TeamUp</span>
          <span className="logo-bracket">{"/>"}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="chip chip-alert text-xs py-1 px-2.5 font-mono border-amber-500 bg-amber-100 font-bold shadow-[2px_2px_0px_#1a1a1a] border-[1.5px] border-stone-900 text-amber-950">
            ⚡ SIH 2026 Open
          </span>
          <Link href="/login" className="btn-t">
            Log in
          </Link>
          <Link href="/signup" className="btn-t btn-t-brand">
            Get started
          </Link>
        </div>
      </header>

      {/* ── Section 1: Visitors / Welcome Banner ── */}
      <fieldset className="t-fieldset">
        <legend className="t-legend">- cat ~/for-visitors.md -</legend>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm font-medium text-stone-800">
            <span className="text-2xl">👋</span>
            <span className="leading-snug">
              <strong>visiting from public SIH broadcast groups?</strong> we put a structured teammate matching platform together for you.
            </span>
          </div>
          <Link href="#live-teams" className="btn-t btn-t-sm font-mono font-bold uppercase tracking-wide bg-white">
            resources &amp; teams ↓
          </Link>
        </div>
      </fieldset>

      {/* ── Section 2: Who We Are & Overview ── */}
      <fieldset className="t-fieldset">
        <legend className="t-legend">- whoami -</legend>
        <div className="space-y-4 text-stone-800 leading-relaxed text-base">
          <p className="text-lg font-bold text-stone-900">
            Hii!! Welcome to <span className="font-mono bg-white px-2 py-0.5 border-[1.5px] border-stone-900 font-extrabold shadow-[2px_2px_0px_#1a1a1a] inline-block mx-1 text-base"><span className="logo-bracket">{"<"}</span>TeamUp<span className="logo-bracket">{"/>"}</span></span>, the verified semi-anonymous teammate platform for Smart India Hackathon (you&apos;ve probably experienced chaotic WhatsApp groups before)
          </p>
          <p>
            Most of hackathon preparation goes into spamming public group chats, reading endless <em>&ldquo;I know HTML, please invite me&rdquo;</em> broadcast messages, and trying to build a balanced 6-person team before the official registration portal freezes.
          </p>
          <p>
            When you&apos;re not building something awesome, you shouldn&apos;t have to expose your personal mobile number to 1,000+ strangers just to find one good AI/ML developer or fulfill the mandatory SIH gender diversity quota.
          </p>
          <p className="font-bold text-stone-950 bg-amber-50 p-3 border-[1.5px] border-stone-900 shadow-[2px_2px_0_#1a1a1a] inline-block w-full text-center sm:text-left">
            🎯 Browse real verified teams, inspect exact skill gaps, and apply confidentially with 1-click!
          </p>
        </div>

        <hr className="t-separator" />

        <div className="flex flex-wrap gap-4">
          <Link href="/signup?path=join" className="btn-t btn-t-brand btn-t-lg font-mono">
            🔍 Join a Verified Team
          </Link>
          <Link href="/signup?path=create" className="btn-t btn-t-lg font-mono bg-white">
            ⚡ Create &amp; Lead a Team
          </Link>
        </div>
      </fieldset>

      {/* ── Section 3: Interactive Tabs & Motto ── */}
      <fieldset className="t-fieldset">
        <legend className="t-legend">- cat ~/random.md -</legend>
        <div className="mb-4">
          <p className="section-label mb-1">Our Platform Motto</p>
          <p className="font-mono text-sm text-stone-900 font-semibold italic bg-white p-2.5 border-[1.5px] border-stone-900 shadow-[2px_2px_0_#1a1a1a]">
            &ldquo;Stop broadcasting in public chats. Start precision matching.&rdquo; — SIH 2026 finalists
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 pt-2">
          <button className="btn-t btn-t-brand justify-center font-mono text-xs font-bold">All Themes</button>
          <button className="btn-t justify-center font-mono text-xs bg-white">AI / ML</button>
          <button className="btn-t justify-center font-mono text-xs bg-white">Web3 / Fin</button>
          <button className="btn-t justify-center font-mono text-xs bg-white">MedTech</button>
          <button className="btn-t justify-center font-mono text-xs col-span-2 sm:col-span-1 bg-white">IoT / Drones</button>
        </div>
      </fieldset>

      {/* ── Section 4: Live Teams Feed ── */}
      <fieldset className="t-fieldset" id="live-teams">
        <legend className="t-legend">- cat ~/live-teams.md -</legend>
        <p className="section-label mb-4">the more professional-looking part of teammate finding</p>

        <div className="space-y-4">
          {/* Team Record 1 */}
          <div className="t-card">
            <div className="t-card-header">
              <div className="flex items-center gap-3">
                <div className="t-avatar text-stone-900 bg-indigo-100 font-bold text-sm">
                  NF
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-950 leading-tight">Neural Forge</h3>
                  <span className="text-xs text-stone-600 font-mono font-medium">Theme: Smart Automation &amp; GovTech</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="chip chip-alert border-amber-600 text-amber-900">⚠️ 2 Spots Open</span>
                <span className="chip border-stone-900 font-bold bg-white text-stone-900 shadow-[1px_1px_0px_#1a1a1a]">04 / 06 filled</span>
              </div>
            </div>
            
            <p className="text-sm text-stone-800 font-medium mb-4 leading-relaxed">
              Building an automated document verification and municipal fraud detection engine using Computer Vision &amp; LLMs. We have backend and design sorted; looking for high-performance ML engineers!
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-300">
              <div className="flex flex-wrap gap-1.5">
                <span className="chip chip-brand">PyTorch</span>
                <span className="chip chip-brand">FastAPI</span>
                <span className="chip bg-stone-100 border-stone-400 text-stone-800 font-bold">Next.js 15</span>
              </div>
              <Link href="/signup?team=neural-forge" className="btn-t btn-t-sm font-mono font-bold text-stone-950 bg-stone-100 border-stone-900">
                apply confidentially →
              </Link>
            </div>
          </div>

          {/* Team Record 2 */}
          <div className="t-card">
            <div className="t-card-header">
              <div className="flex items-center gap-3">
                <div className="t-avatar text-stone-900 bg-emerald-100 font-bold text-sm">
                  BM
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-950 leading-tight">BlockMed Labs</h3>
                  <span className="text-xs text-stone-600 font-mono font-medium">Theme: Healthcare &amp; Cybersecurity</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="chip bg-rose-100 border-rose-600 text-rose-950 font-bold shadow-[1px_1px_0px_#1a1a1a]">🎯 Female Teammate Needed</span>
                <span className="chip border-stone-900 font-bold bg-white text-stone-900 shadow-[1px_1px_0px_#1a1a1a]">05 / 06 filled</span>
              </div>
            </div>

            <p className="text-sm text-stone-800 font-medium mb-4 leading-relaxed">
              Zero-knowledge diagnostic transfer protocols allowing ambulance paramedics to instantly secure emergency medical history access during trauma transit without compromising patient privacy laws.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-300">
              <div className="flex flex-wrap gap-1.5">
                <span className="chip chip-brand">Rust</span>
                <span className="chip chip-brand">Solidity / Web3</span>
                <span className="chip bg-stone-100 border-stone-400 text-stone-800 font-bold">React Native</span>
              </div>
              <Link href="/signup?team=blockmed" className="btn-t btn-t-sm font-mono font-bold text-stone-950 bg-stone-100 border-stone-900">
                apply confidentially →
              </Link>
            </div>
          </div>

          {/* Team Record 3 */}
          <div className="t-card">
            <div className="t-card-header">
              <div className="flex items-center gap-3">
                <div className="t-avatar text-stone-900 bg-amber-100 font-bold text-sm">
                  AA
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-950 leading-tight">AeroAgri Tech</h3>
                  <span className="text-xs text-stone-600 font-mono font-medium">Theme: Agriculture, FoodTech &amp; IoT</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <span className="chip chip-alert border-amber-600 text-amber-900">⚠️ 3 Spots Open</span>
                <span className="chip border-stone-900 font-bold bg-white text-stone-900 shadow-[1px_1px_0px_#1a1a1a]">03 / 06 filled</span>
              </div>
            </div>

            <p className="text-sm text-stone-800 font-medium mb-4 leading-relaxed">
              Developing drone hyperspectral telemetry sensors that precisely detect soil nutrient depletion across rural farm grids to automate organic fertilizer irrigation.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-300">
              <div className="flex flex-wrap gap-1.5">
                <span className="chip chip-brand">ROS2 / Drones</span>
                <span className="chip chip-brand">C++ / Embedded</span>
                <span className="chip bg-stone-100 border-stone-400 text-stone-800 font-bold">Flutter</span>
              </div>
              <Link href="/signup?team=aeroagri" className="btn-t btn-t-sm font-mono font-bold text-stone-950 bg-stone-100 border-stone-900">
                apply confidentially →
              </Link>
            </div>
          </div>
        </div>
      </fieldset>

      {/* ── Section 5: Transparency & Privacy Model ── */}
      <fieldset className="t-fieldset">
        <legend className="t-legend">- cat ~/security-and-privacy.md -</legend>
        <p className="section-label mb-4">how we protect students from public spam &amp; fake profiles</p>
        
        <div className="space-y-3 font-mono text-xs sm:text-sm text-stone-900">
          <div className="p-3.5 bg-white border-[1.5px] border-stone-900 rounded-[2px] shadow-[2px_2px_0px_#1a1a1a]">
            <span className="text-emerald-800 font-extrabold bg-emerald-100 px-2 py-0.5 border border-emerald-500 rounded text-xs mr-2 inline-block mb-1">✓ VERIFIED ID CARDS</span> 
            Every college student is checked against an automated college ID card verification pipeline before joining teams.
          </div>
          <div className="p-3.5 bg-white border-[1.5px] border-stone-900 rounded-[2px] shadow-[2px_2px_0px_#1a1a1a]">
            <span className="text-indigo-900 font-extrabold bg-indigo-100 px-2 py-0.5 border border-indigo-500 rounded text-xs mr-2 inline-block mb-1">✓ LEADER ACCOUNTABILITY</span> 
            Team leaders must make their contact details visible to verified logged-in users so you know exactly who you are working with.
          </div>
          <div className="p-3.5 bg-white border-[1.5px] border-stone-900 rounded-[2px] shadow-[2px_2px_0px_#1a1a1a]">
            <span className="text-blue-900 font-extrabold bg-blue-100 px-2 py-0.5 border border-blue-500 rounded text-xs mr-2 inline-block mb-1">🔒 PRIVATE APPLICATIONS</span> 
            When you apply to a team, your personal profile is shared ONLY with that team&apos;s leader. You are never broadcasted to public WhatsApp groups.
          </div>
        </div>
      </fieldset>

      {/* ── Footer ── */}
      <footer className="mt-12 pt-6 border-t-[2px] border-stone-400 text-center font-mono text-xs text-stone-600">
        <div className="mb-2">
          <span className="logo-bracket">{"<"}</span>
          <span className="font-extrabold text-stone-900 text-sm">TeamUp</span>
          <span className="logo-bracket">{"/>"}</span>
          {" "}— Built for Smart India Hackathon 2026
        </div>
        <p className="font-medium">Semi-anonymous • Verified teammates • Zero public spam</p>
      </footer>
    </div>
  );
}
