import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { contains: 'ELISH' } },
    include: {
      team_memberships: true,
      led_teams: true
    }
  });
  console.dir(users, { depth: null });
}

main().catch(console.error);
