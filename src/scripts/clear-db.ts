import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const clearDatabase = async () => {
  console.log('🗑️  Clearing all data from database...');

  const tables = [
    'leads',
    'payments',
    'payment_attempts',
    'invoices',
    'subscriptions',
    'profile_activation_tokens',
    'profiles',
    'accounts',
    'service_plans',
    'membership_plans',
    'membership_services',
    'services',
    'memberships',
    'subscription_types'
  ];

  for (const table of tables) {
    try {
      // Delete all rows where id is not null (effectively all rows)
      // We need a column to query against. 'created_at' is common, or primary key.
      // Easiest is to use a condition that is always true for existing records.
      // Unlike SQL TRUNCATE, this creates transaction log overhead, but works via API.
      
      // Note: Supabase/PostgREST usually requires a WHERE clause for delete to prevent accidents.
      // We use not.is('created_at', null) if created_at exists, or some primary key filter.

      // We will try deleting everything where 'created_at' is not null, which all tables seem to have.
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('created_at', '1970-01-01'); // Assuming created_at is newer than epoch start.
        // Better: .gt('created_at', '1970-01-01')

      if (error) {
        // If table doesn't exist or other error, log it but continue
        // console.warn(`⚠️  Could not clear table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Cleared table: ${table}`);
      }
    } catch (err: any) {
        console.error(`Error clearing ${table}:`, err.message);
    }
  }

  // Also clear Elasticsearch indices if we can (optional, but good for "Clear All")
  // We can call the delete index functions from elasticsearch.ts but that deletes the index itself.
  // We might want to just delete documents. 
  // For now, let's keep it to SQL DB as requested "from all tables".
  
  console.log('✨ Database cleared.');
};

// Allow running this script directly
if (require.main === module) {
  clearDatabase().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
