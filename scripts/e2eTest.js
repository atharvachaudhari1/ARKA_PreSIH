const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runE2E() {
  console.log("=== STARTING FULL SYSTEM E2E CHECK ===");

  // Cleanup past test runs
  await prisma.user.deleteMany({ where: { email: { contains: 'e2e_test' } } });
  await prisma.team.deleteMany({ where: { name: { contains: 'E2E Test Team' } } });

  try {
    // 1. Create Test Users
    console.log("-> 1. Creating test users (Simulating signup & profile completion)...");
    
    // Leader
    const leader = await prisma.user.create({
      data: {
        auth_user_id: 'e2e-leader-auth',
        email: 'leader@e2e_test.com',
        name: 'E2E Leader',
        gender: 'female',
        counts_toward_female_quota: true,
        college: 'Test College',
        department: 'CS',
        verification_status: 'verified',
        verification_method: 'manual_review',
        id_card_storage_path: 'dummy/path.pdf',
        resume_storage_path: 'dummy/resume.pdf',
      }
    });

    // Applicant
    const applicant = await prisma.user.create({
      data: {
        auth_user_id: 'e2e-applicant-auth',
        email: 'applicant@e2e_test.com',
        name: 'E2E Applicant',
        gender: 'male',
        counts_toward_female_quota: false,
        college: 'Test College',
        department: 'CS',
        verification_status: 'verified',
        verification_method: 'manual_review',
        id_card_storage_path: 'dummy/path.pdf',
      }
    });

    console.log("   ✓ Users created successfully.");

    // 2. Team Creation
    console.log("-> 2. Creating team (Leader)...");
    const team = await prisma.team.create({
      data: {
        name: 'E2E Test Team',
        leader_id: leader.id,
        description: 'Testing E2E flow',
        looking_for_skills: 'React, Node',
        theme_preferences: 'Web3',
        needed_female_count: 1,
        status: 'open',
        team_memberships: {
          create: {
            user_id: leader.id,
            role: 'leader',
          }
        },
        slots: {
          create: [
            { role: 'Frontend', index: 0, is_filled: true, filled_by_id: leader.id },
            { role: 'Backend', index: 1, is_filled: false }
          ]
        }
      },
      include: { slots: true, team_memberships: true }
    });

    if (team.team_memberships.length !== 1 || team.slots.length !== 2) {
      throw new Error("Team creation failed constraints.");
    }
    console.log("   ✓ Team created successfully.");

    // 3. Join Request
    console.log("-> 3. Submitting Join Request (Applicant)...");
    const request = await prisma.joinRequest.create({
      data: {
        team_id: team.id,
        requester_id: applicant.id,
        direction: 'user_to_team',
        status: 'pending'
      }
    });

    console.log("   ✓ Join request submitted successfully.");

    // 4. Accept Request
    console.log("-> 4. Leader accepts request...");
    await prisma.$transaction(async (tx) => {
      await tx.joinRequest.update({
        where: { id: request.id },
        data: { status: 'accepted', final_decision_by: leader.id, resolved_at: new Date() }
      });
      await tx.teamMembership.create({
        data: { team_id: team.id, user_id: applicant.id, role: 'member' }
      });
      const emptySlot = team.slots.find(s => !s.is_filled);
      if (emptySlot) {
        await tx.teamSlot.update({
          where: { id: emptySlot.id },
          data: { is_filled: true, filled_by_id: applicant.id }
        });
      }
      
      const newTeam = await tx.team.findUnique({
        where: { id: team.id },
        include: { slots: true }
      });
      const allFilled = newTeam.slots.every(s => s.is_filled);
      if (allFilled) {
        await tx.team.update({
          where: { id: team.id },
          data: { status: 'full' }
        });
      }
    });

    const finalTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: { slots: true, team_memberships: true }
    });

    if (finalTeam.status !== 'full') throw new Error("Team status should be 'full'");
    if (finalTeam.slots.every(s => s.is_filled) !== true) throw new Error("Not all slots filled");
    console.log("   ✓ Request accepted. Team slots and status updated successfully.");

    console.log("=== E2E CHECK COMPLETED SUCCESSFULLY ===");

  } catch (error) {
    console.error("❌ E2E TEST FAILED:");
    console.error(error);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({ where: { email: { contains: 'e2e_test' } } });
    await prisma.team.deleteMany({ where: { name: { contains: 'E2E Test Team' } } });
    await prisma.$disconnect();
  }
}

runE2E();
