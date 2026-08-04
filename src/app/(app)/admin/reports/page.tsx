import { prisma } from "@/lib/prisma";
import ReportClient from "./ReportClient";

export default async function ReportsPage() {
  const openReports = await prisma.report.findMany({
    where: { status: "open" },
    include: {
      reporter: { select: { name: true, email: true } },
      reported_user: { select: { name: true, email: true } },
      reported_team: { select: { name: true } }
    },
    orderBy: { created_at: "asc" }
  });

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Reports Queue</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Review and resolve user and team reports.
        </p>
      </div>

      <ReportClient initialReports={openReports} />
    </div>
  );
}
