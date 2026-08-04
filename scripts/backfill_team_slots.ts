import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting backfill for existing teams...");
  const teams = await prisma.team.findMany({
    include: { event: true, memberships: true, slots: true }
  });

  for (const team of teams) {
    if (team.slots.length > 0) {
      console.log(`Team ${team.id} already has slots. Skipping.`);
      continue;
    }

    const maxMembers = team.event.team_size_max || 6;
    const currentMembers = team.memberships.length;
    let neededFemale = team.needed_female_count;
    
    // First, create filled slots for existing members
    for (const membership of team.memberships) {
      // Look up member gender just in case, but we can just mark it filled.
      await prisma.teamSlot.create({
        data: {
          team_id: team.id,
          role_title: membership.role === "leader" ? "Team Leader" : "Team Member",
          gender: "any",
          skills: [],
          is_filled: true,
          filled_by_user_id: membership.user_id
        }
      });
    }

    // Then, create open slots for remaining capacity
    const remainingSlots = maxMembers - currentMembers;
    for (let i = 0; i < remainingSlots; i++) {
      const genderReq = neededFemale > 0 ? "female" : "any";
      if (neededFemale > 0) neededFemale--;

      await prisma.teamSlot.create({
        data: {
          team_id: team.id,
          role_title: `Open Position ${i + 1}`,
          gender: genderReq,
          skills: team.skills_needed,
          is_filled: false
        }
      });
    }
    console.log(`Migrated team ${team.id} (${team.name}) - created ${maxMembers} slots.`);
  }
  console.log("Backfill complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
