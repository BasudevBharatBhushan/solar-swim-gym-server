import supabase from '../config/db';

async function clearDatabase() {
  console.log('🧹 Clearing database...');

  const tables = [
    'subscription_coverage',
    'subscription',
    'payment',
    'invoice',
    'membership_service',
    'membership_fee',
    'membership_eligibility_rule',
    'membership_program_category',
    'membership_program',
    'service_price',
    'base_price',
    'service',
    'leads',
    'account_activation_tokens',
    'profile',
    'account',
    'staff',
    'waiver_program',
    'subscription_term',
    'age_group',
    'location'
  ];

  for (const table of tables) {
    console.log(`Clearing table: ${table}...`);
    
    // Determine the ID column for each table to use as a filter
    const idMap: Record<string, string> = {
      'age_group': 'age_group_id',
      'membership_eligibility_rule': 'rule_id',
      'membership_fee': 'membership_fee_id',
      'membership_service': 'membership_service_id',
      'membership_program_category': 'category_id',
      'membership_program': 'membership_program_id',
      'service_price': 'service_price_id',
      'base_price': 'base_price_id',
      'service': 'service_id',
      'leads': 'lead_id',
      'account_activation_tokens': 'token_id',
      'profile': 'profile_id',
      'account': 'account_id',
      'staff': 'staff_id',
      'waiver_program': 'waiver_program_id',
      'subscription_term': 'subscription_term_id',
      'subscription_coverage': 'subscription_coverage_id',
      'subscription': 'subscription_id',
      'payment': 'payment_id',
      'invoice': 'invoice_id',
      'location': 'location_id'
    };

    const idColumn = idMap[table] || 'created_at';

    // Using .neq with a nonsensical value of the right type
    // or .not('id', 'is', null)
    const { error } = await supabase
      .from(table)
      .delete()
      .filter(idColumn, 'neq', '00000000-0000-0000-0000-000000000001');

    if (error) {
      console.warn(`⚠️ Warning: Could not clear table ${table}:`, error.message);
    } else {
      console.log(`✅ Table ${table} cleared.`);
    }
  }

  console.log('✨ Database cleanup complete!');
}

clearDatabase().catch(err => {
  console.error('❌ Error clearing database:', err);
  process.exit(1);
});
