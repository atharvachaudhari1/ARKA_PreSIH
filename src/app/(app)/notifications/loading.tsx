export default function NotificationsLoading() {
  return (
    <div style={{ padding: "2rem 1.25rem", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ width: 240, height: 28, background: "#1a1a1a", borderRadius: 3, marginBottom: "0.75rem", opacity: 0.15 }} />
      <div style={{ width: 300, height: 44, background: "#e5e5e5", borderRadius: 4, marginBottom: "2rem" }} />
      {[1,2,3,4].map(n => (
        <div key={n} style={{ height: 100, background: "#f5f3ec", border: "2px dashed #1a1a1a", borderRadius: 6, marginBottom: "0.75rem" }} />
      ))}
    </div>
  );
}
