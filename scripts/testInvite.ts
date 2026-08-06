import { prisma } from '../src/lib/prisma';

async function main() {
  const team = await prisma.team.findFirst({ where: { name: 'Demons' } });
  if (!team) throw new Error("Team not found");

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      email: 'testinvite@example.com',
      auth_user_id: 'test-auth-invite-' + Date.now(),
      name: 'Test Invited Member',
      department: 'CSE',
      college: 'Test College',
      verification_status: 'verified',
    }
  });

  // Create a join request (invite) for this test user to the Demons team
  await prisma.joinRequest.create({
    data: {
      team_id: team.id,
      requester_id: testUser.id,
      direction: 'team_to_user',
      status: 'pending'
    }
  });

  console.log("Test user invited successfully to Demons.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
