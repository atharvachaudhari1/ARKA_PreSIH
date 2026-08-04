import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { createClient } from '@supabase/supabase-js';
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
    console.log(`Event ${eventName} already exists`);
  }

  // Admin bootstrap
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists in Supabase Auth
    const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
    let authUser = users?.find(u => u.email === adminEmail);

    if (!authUser) {
      console.log(`Creating admin user ${adminEmail} in Supabase Auth...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      });
      if (error) {
        console.error("Failed to create admin in Supabase Auth:", error);
      } else {
        authUser = data.user;
      }
    } else {
      console.log(`Admin user ${adminEmail} already exists in Supabase Auth.`);
      // Optionally update password if we want to reset it
      await supabase.auth.admin.updateUserById(authUser.id, { password: adminPassword });
    }

    if (authUser) {
      // Ensure they exist in Prisma
      let dbUser = await prisma.user.findUnique({ where: { email: adminEmail } });
      
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            auth_user_id: authUser.id,
            email: adminEmail,
            name: "System Admin",
            is_admin: true,
            verification_status: "verified",
          }
        });
        console.log(`Created admin user record in database for ${adminEmail}`);
      } else if (!dbUser.is_admin) {
        await prisma.user.update({
          where: { email: adminEmail },
          data: { is_admin: true }
        });
        console.log(`Granted admin privileges to existing database user: ${adminEmail}`);
      } else {
        console.log(`Database user ${adminEmail} is already an admin.`);
      }
    }
  } else {
    console.log('No ADMIN_EMAIL or ADMIN_PASSWORD in environment variables. Skipping admin bootstrap.');
  }

  // Backfill existing teams if for some reason they exist but don't point to this event.
  // Note: Schema requires event_id on Team, so teams must point to an event.
  // If there's an existing dummy event, we could migrate them, but we'll assume they point to valid events.
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
