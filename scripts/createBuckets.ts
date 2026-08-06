import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Checking and creating storage buckets...");

  const buckets = ['id-cards', 'resumes'];

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error && error.message.includes('not found')) {
      console.log(`Bucket '${bucket}' not found. Creating...`);
      const { data: createData, error: createError } = await supabase.storage.createBucket(bucket, {
        public: false, // private bucket
        allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        console.error(`❌ Failed to create bucket '${bucket}':`, createError);
      } else {
        console.log(`✅ Bucket '${bucket}' created successfully.`);
      }
    } else if (data) {
      console.log(`✅ Bucket '${bucket}' already exists.`);
    } else if (error) {
      console.error(`❌ Error checking bucket '${bucket}':`, error);
    }
  }
}

main().catch(console.error);
