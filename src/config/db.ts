import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in .env file. Please ensure SUPABASE_URL and a key (SUPABASE_SERVICE_KEY or SUPABASE_PUBLISHABLE_DEFAULT_KEY) are set.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to check connection
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('location').select('count', { count: 'exact', head: true });
    if (error) {
       console.error('❌ Supabase connection check failed:', error.message);
       return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (err: any) {
    console.error('❌ Supabase connection error:', err.message);
    return false;
  }
};

export default supabase;
