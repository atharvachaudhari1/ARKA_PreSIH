export default function ProfileLoading() {
  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ width: 160, height: 28, background: "#1a1a1a", borderRadius: 3, marginBottom: "0.75rem", opacity: 0.15 }} />
      <div style={{ width: 260, height: 44, background: "#e5e5e5", borderRadius: 4, marginBottom: "2rem" }} />
      {[280, 200, 240].map((h, i) => (
        <div key={i} style={{ height: h, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: 6, marginBottom: "1.5rem" }} />
      ))}
    </div>
  );
}
