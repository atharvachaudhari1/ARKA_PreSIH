import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';

async function main() {
  const teams = await prisma.team.findMany();
  console.dir(teams, { depth: null });
}

main().catch(console.error);
