require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("Seeding test users...");
  
  const user1 = await prisma.user.create({
    data: {
      auth_user_id: "test_legacy_1_" + Date.now(),
      name: "Legacy Stuck 1", email: "l1_" + Date.now() + "@test.edu",
      verification_status: "pending", verification_method: "auto"
    }
  });

  const user2 = await prisma.user.create({
    data: {
      auth_user_id: "test_legacy_2_" + Date.now(),
      name: "Legacy Stuck 2", email: "l2_" + Date.now() + "@test.edu",
      verification_status: "pending", verification_method: "auto"
    }
  });

  const user3 = await prisma.user.create({
    data: {
      auth_user_id: "test_legit_pathb_" + Date.now(),
      name: "Legit Path B", email: "pathb_" + Date.now() + "@test.edu",
      verification_status: "pending", verification_method: "manual_review"
    }
  });

  const users = [user1, user2, user3];

  console.log("BEFORE RESOLUTION:");
  for (const u of users) {
    console.log(`User ${u.name} (${u.id}) -> Status: ${u.verification_status}, Method: ${u.verification_method}`);
  }

  // Exact logic from route.ts
  const result = await prisma.user.updateMany({
    where: { verification_status: "pending", verification_method: "auto" },
    data: { verification_status: "pending", verification_method: null }
  });
  
  console.log(`\nResolving... affected ${result.count} users.`);

  console.log("\nAFTER RESOLUTION:");
  for (const u of users) {
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    console.log(`User ${after.name} (${after.id}) -> Status: ${after.verification_status}, Method: ${after.verification_method}`);
  }

  // Clean up
  await prisma.user.deleteMany({
    where: { id: { in: users.map(u => u.id) } }
  });
  console.log("\nCleaned up fake users.");
}
run();
