import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initStorage() {
  console.log('Initializing Signed Waivers Storage...');
  const bucketName = 'signed-waivers';

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets.find(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
      
      // Update config
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      });
      
      if (updateError) {
          console.warn(`Warning: Could not update bucket '${bucketName}':`, updateError.message);
      } else {
          console.log(`Bucket '${bucketName}' updated configuration.`);
      }

    } else {
      console.log(`Bucket '${bucketName}' does not exist. Creating...`);
      const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      console.log(`Successfully created bucket '${bucketName}'.`);
    }

  } catch (err: any) {
    console.error('Error initializing storage:', err.message);
    process.exit(1);
  }
}

initStorage();
