export default function RequestsLoading() {
  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ width: 160, height: 28, background: "#1a1a1a", borderRadius: 3, marginBottom: "0.75rem", opacity: 0.15 }} />
      <div style={{ width: 280, height: 40, background: "#e5e5e5", borderRadius: 4, marginBottom: "2rem" }} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 120, height: 40, background: "#1a1a1a", borderRadius: 4 }} />
        <div style={{ width: 120, height: 40, background: "#e5e5e5", borderRadius: 4, border: "2px solid #1a1a1a" }} />
      </div>
      {[1,2,3].map(n => (
        <div key={n} style={{ height: 140, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: 6, marginBottom: "1rem" }} />
      ))}
    </div>
  );
}
