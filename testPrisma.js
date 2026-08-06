require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const count = await prisma.user.count();
    console.log("Users:", count);
  } catch(e) {
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}
run();
