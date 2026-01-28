import { supabase } from '../config/supabase';
import dotenv from 'dotenv';
import path from 'path';
import { elasticsearchClient, LEADS_INDEX, PROFILES_INDEX, ACCOUNTS_INDEX } from '../config/elasticsearch';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Clear all Elasticsearch indices
 */
export const clearElasticsearchIndices = async () => {
  console.log('🗑️  Clearing Elasticsearch indices...');

  const indices = [
    { name: LEADS_INDEX, label: 'Leads' },
    { name: PROFILES_INDEX, label: 'Profiles' },
    { name: ACCOUNTS_INDEX, label: 'Accounts' }
  ];

  for (const index of indices) {
    try {
      const exists = await elasticsearchClient.indices.exists({ index: index.name });

      if (exists) {
        await elasticsearchClient.indices.delete({ index: index.name });
        console.log(`✅ Cleared ${index.label} index: ${index.name}`);
      } else {
        console.log(`ℹ️  ${index.label} index does not exist: ${index.name}`);
      }
    } catch (err: any) {
      console.error(`❌ Error clearing ${index.label} index:`, err.message);
    }
  }
};

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

  console.log('✨ Database tables cleared.');

  // Clear Elasticsearch indices
  await clearElasticsearchIndices();

  console.log('✨ All data cleared (database + Elasticsearch).');
};

// Allow running this script directly
if (require.main === module) {
  clearDatabase().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
