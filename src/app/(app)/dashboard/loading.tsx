export default function DashboardLoading() {
  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: 1000, margin: "0 auto" }}>
      {/* Terminal badge skeleton */}
      <div style={{ width: 200, height: 28, background: "#1a1a1a", borderRadius: 3, marginBottom: "0.75rem", opacity: 0.15 }} />
      <div style={{ width: 320, height: 44, background: "#e5e5e5", borderRadius: 4, marginBottom: "0.5rem" }} />
      <div style={{ width: 260, height: 22, background: "#e5e5e5", borderRadius: 4, marginBottom: "3rem" }} />
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {[1, 2].map(n => (
          <div key={n} style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 6, overflow: "hidden", boxShadow: "4px 4px 0px #1a1a1a" }}>
            <div style={{ background: "#1a1a1a", height: 40, opacity: 0.08 }} />
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 56, background: "#f5f3ec", borderRadius: 4, border: "2px solid #e5e5e5" }} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
