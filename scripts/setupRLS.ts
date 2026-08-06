import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("Setting up RLS policies for resumes bucket...");
  
  try {
    // Enable RLS on storage.objects (if not already enabled)
    await prisma.$executeRawUnsafe(`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`);
    console.log("RLS enabled on storage.objects.");

    // Create policy for INSERT: users can upload to their own folder in resumes
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can upload their own resumes"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `).catch(e => console.log("Insert policy might already exist:", e.message));

    // Create policy for SELECT: users can read their own resume
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can view their own resumes"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `).catch(e => console.log("Select policy might already exist:", e.message));
    
    // Create policy for UPDATE: users can update their own resume
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update their own resumes"
      ON storage.objects FOR UPDATE TO authenticated
      USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `).catch(e => console.log("Update policy might already exist:", e.message));

    // Create policy for DELETE: users can delete their own resume
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can delete their own resumes"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `).catch(e => console.log("Delete policy might already exist:", e.message));

    console.log("✅ RLS policies created.");
  } catch (error) {
    console.error("❌ Error setting up RLS:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
