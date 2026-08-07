import type { Prisma } from "@prisma/client";

/**
 * Recomputed needed_female_count = max(0, event.min_female_required - female members).
 * No verification gate: every registered user's self-reported gender counts directly.
 * Must be called inside a transaction after any membership change (accept, leave, etc.)
 */
export async function recomputeNeededFemaleCount(tx: Prisma.TransactionClient, teamId: string) {
  const team = await tx.team.findUnique({
    where: { id: teamId },
    include: {
      event: true,
      memberships: {
        include: {
          user: { select: { counts_toward_female_quota: true } },
        },
      },
    },
  });
  if (!team || !team.event) return;

  const femaleCount = team.memberships.filter(
    (m) => !!m.user && m.user.counts_toward_female_quota
  ).length;

  const needed = Math.max(0, team.event.min_female_required - femaleCount);
  await tx.team.update({
    where: { id: teamId },
    data: { needed_female_count: needed },
  });
}
