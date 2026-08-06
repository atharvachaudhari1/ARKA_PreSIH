require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const t = await pool.query(`SELECT tablename FROM pg_tables WHERE tablename IN ('team_slots', 'ocr_verification_attempts', 'email_verification_otps')`);
  console.log('Tables:', t.rows);
  const c3 = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='verification_method'`);
  console.log('verification_method:', c3.rows);
  pool.end();
}
check();
