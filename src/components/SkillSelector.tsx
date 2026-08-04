import React, { useState, useRef, useEffect } from "react";

export const COMMON_SKILLS = [
  { name: "React", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(90 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(150 12 12)"/></svg> },
  { name: "Node.js", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { name: "Python", logo: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.36,14.23v-1.7c0-0.74-0.6-1.34-1.34-1.34H11V9.82h3.36V7.47H11c-1.3,0-2.36,1.06-2.36,2.36v1.34H6.27v1.7c0,0.74,0.6,1.34,1.34,1.34h2.36v1.36H6.62v2.36H11c1.3,0,2.36-1.06,2.36-2.36v-1.34h2.36V14.23z"/></svg> },
  { name: "Figma", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5.333 7.333c0-1.84 1.493-3.333 3.334-3.333h6.666a3.333 3.333 0 0 1 0 6.666H8.667a3.333 3.333 0 0 1-3.334-3.333zm0 9.334c0-1.84 1.493-3.334 3.334-3.334h3.333v6.667a3.333 3.333 0 0 1-6.667-3.333zm10 0a3.333 3.333 0 0 0 0-6.667h-3.333v6.667a3.333 3.333 0 0 0 3.333 0z"/></svg> },
  { name: "UI/UX", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg> },
  { name: "Next.js", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 18v-8M12 6h.01"/></svg> },
  { name: "Docker", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13h18M3 17h18M3 9h18"/></svg> },
  { name: "AWS", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { name: "Java", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/></svg> },
  { name: "C++", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6M12 4v16"/></svg> },
  { name: "MongoDB", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 6 7 6 12c0 3 2 6 6 10 4-4 6-7 6-10 0-5-2-10-6-10z"/></svg> },
  { name: "PostgreSQL", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5M3 12A9 3 0 0 0 21 12"/></svg> },
  { name: "Django", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20"/></svg> },
  { name: "Tailwind", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> },
  { name: "TypeScript", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="4"/><path d="M16 18L10 12L16 6M8 6V18"/></svg> },
  { name: "Angular", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l2 11 8 4 8-4 2-11-10-5z"/></svg> },
  { name: "Vue", logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20L2 6h5l5 8 5-8h5z"/></svg> },
];

export function getSkillLogo(skillName: string) {
  const found = COMMON_SKILLS.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  if (found) return found.logo;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>;
}

interface SkillSelectorProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillSelector({ selectedSkills, onChange }: SkillSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = COMMON_SKILLS.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) && !selectedSkills.includes(s.name));

  function addSkill(skill: string) {
    if (!selectedSkills.includes(skill)) {
      onChange([...selectedSkills, skill]);
    }
    setQuery("");
    setOpen(false);
  }

  function removeSkill(skill: string) {
    onChange(selectedSkills.filter(s => s !== skill));
  }

  return (
    <div style={{ position: "relative", fontFamily: "var(--font-mono)" }} ref={containerRef}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
        {selectedSkills.map(skill => (
          <div key={skill} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "#f5f3ff", border: "1.5px solid #5b5fc7", borderRadius: "4px", padding: "0.2rem 0.5rem", fontSize: "0.75rem", fontWeight: 700, color: "#5b5fc7" }}>
            <span style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {getSkillLogo(skill)}
            </span>
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              style={{ background: "none", border: "none", color: "#5b5fc7", cursor: "pointer", marginLeft: "0.2rem", fontSize: "0.9rem", lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      
      <input
        type="text"
        placeholder={selectedSkills.length === 0 ? "Search and add skills..." : "Add another skill..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "0.4rem 0.6rem",
          minHeight: "36px",
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          borderRadius: "4px",
          fontSize: "0.85rem",
          outline: "none",
          transition: "box-shadow 0.15s ease",
          boxSizing: "border-box"
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            e.preventDefault();
            // If there's an exact match in filtered, pick it. Otherwise, add as custom.
            const match = filtered.find(s => s.name.toLowerCase() === query.toLowerCase());
            if (match) {
              addSkill(match.name);
            } else {
              addSkill(query.trim());
            }
          }
        }}
      />
      
      {open && (query.trim() || filtered.length > 0) && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "#ffffff",
          border: "2px solid #1a1a1a",
          borderRadius: "4px",
          boxShadow: "3px 3px 0px #1a1a1a",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}>
          {filtered.map(s => (
            <button
              key={s.name}
              type="button"
              onClick={() => addSkill(s.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.8rem",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid #e5e5e5",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                textAlign: "left"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#f9fafb"}
              onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ width: 16, height: 16, color: "#1a1a1a" }}>{s.logo}</span>
              {s.name}
            </button>
          ))}
          {query.trim() && !filtered.find(s => s.name.toLowerCase() === query.toLowerCase()) && (
            <button
              type="button"
              onClick={() => addSkill(query.trim())}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.8rem",
                background: "#f0fdf4",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#166534",
                textAlign: "left"
              }}
            >
              + Add "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
