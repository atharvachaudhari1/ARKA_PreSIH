import { prisma } from "@/lib/prisma";
import VerificationClient from "./VerificationClient";

export default async function VerificationsPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { verification_status: "pending" },
    select: {
      id: true,
      name: true,
      email: true,
      college: true,
      department: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" }
  });

  // We need to fetch the latest OCR attempt for each user to show the confidence score
  const usersWithOcr = await Promise.all(
    pendingUsers.map(async (u) => {
      const latestOcr = await prisma.ocrVerificationAttempt.findFirst({
        where: { user_id: u.id },
        orderBy: { created_at: "desc" },
        select: { ocr_confidence_score: true }
      });
      return {
        ...u,
        ocr_confidence_score: latestOcr?.ocr_confidence_score ?? null
      };
    })
  );

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>ID Verification Queue</h2>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Review users whose ID cards could not be automatically verified by OCR.
        </p>
      </div>

      <VerificationClient initialUsers={usersWithOcr} />
    </div>
  );
}
