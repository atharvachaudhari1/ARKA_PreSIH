import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { prisma } from '../src/lib/prisma';

async function main() {
  const eventName = 'SIH 2026';

  let event = await prisma.event.findFirst({
    where: { name: eventName },
  });

  if (!event) {
    event = await prisma.event.create({
      data: {
        name: eventName,
        team_size_max: 6,
        min_female_required: 1,
        themes: [
          'Smart Automation',
          'Fitness & Sports',
          'Heritage & Culture',
          'MedTech / BioTech / HealthTech',
          'Agriculture, FoodTech & Rural Development',
          'Smart Vehicles',
          'Transportation & Logistics',
          'Robotics and Drones',
          'Clean & Green Technology',
          'Tourism',
          'Renewable / Sustainable Energy',
          'Blockchain & Cybersecurity',
          'Smart Education',
          'Disaster Management',
          'Toys',
          'Miscellaneous',
        ],
        is_active: true,
      },
    });
    console.log(`Created event: ${eventName}`);
  } else {
    console.log(`Event ${eventName} already exists`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
