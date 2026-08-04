export default function TeamsLoading() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 2rem" }}>
      <div style={{ width: 180, height: 28, background: "#1a1a1a", borderRadius: 3, marginBottom: "0.75rem", opacity: 0.15 }} />
      <div style={{ width: 300, height: 48, background: "#e5e5e5", borderRadius: 4, marginBottom: "0.5rem" }} />
      <div style={{ width: 400, height: 22, background: "#e5e5e5", borderRadius: 4, marginBottom: "2.5rem" }} />
      
      <div style={{ background: "#ffffff", border: "2px solid #1a1a1a", borderRadius: 6, marginBottom: "2.5rem", overflow: "hidden", boxShadow: "5px 5px 0px #1a1a1a" }}>
        <div style={{ background: "#1a1a1a", height: 42 }} />
        <div style={{ padding: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {[200, 200, 300, 160, 220].map((w, i) => <div key={i} style={{ height: 44, width: w, background: "#f5f3ec", border: "2px solid #e5e5e5", borderRadius: 4 }} />)}
        </div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.75rem" }}>
        {[1,2,3,4,5,6].map(n => (
          <div key={n} style={{ height: 280, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: 6 }} />
        ))}
      </div>
    </div>
  );
}
