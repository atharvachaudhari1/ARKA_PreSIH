import { prisma } from '../src/lib/prisma';

async function main() {
  const team = await prisma.team.findFirst({
    where: { name: 'Demons' },
    include: {
      slots: true,
      join_requests: true,
      memberships: true,
    }
  });

  console.log(JSON.stringify(team, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
