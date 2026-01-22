import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env file. Please ensure SUPABASE_URL and a key (SUPABASE_SERVICE_KEY or SUPABASE_PUBLISHABLE_DEFAULT_KEY) are set.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
