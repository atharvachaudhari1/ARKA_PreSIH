import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [
    openTeams,
    fullTeams,
    pendingRequests,
    recentSignups,
    activeReports,
    verificationQueue
  ] = await Promise.all([
    prisma.team.count({ where: { status: "open" } }),
    prisma.team.count({ where: { status: "full" } }),
    prisma.joinRequest.count({ where: { status: "pending" } }),
    prisma.user.count({ where: { created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
    prisma.report.count({ where: { status: "open" } }),
    prisma.user.count({ where: { verification_status: "pending" } })
  ]);

  const stats = [
    { label: "Open Teams", value: openTeams, color: "var(--color-brand)" },
    { label: "Full Teams", value: fullTeams, color: "var(--color-brand-light)" },
    { label: "Pending Join Requests", value: pendingRequests, color: "#f59e0b" },
    { label: "New Users (24h)", value: recentSignups, color: "#10b981" },
    { label: "Active Reports", value: activeReports, color: "#ef4444" },
    { label: "Pending Verifications", value: verificationQueue, color: "#8b5cf6" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Platform Overview</h2>
      
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "1.5rem"
      }}>
        {stats.map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-border)" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
