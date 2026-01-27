import { supabase } from '../config/supabase';

async function checkActualSchema() {
  console.log('🔍 Checking actual database schema for service_plans...\n');

  // Query PostgreSQL information_schema directly
  const { data, error } = await supabase
    .rpc('exec_raw_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'service_plans'
        ORDER BY ordinal_position;
      `
    });

  if (error) {
    console.log('⚠️  RPC not available, trying alternative method...\n');
    
    // Try using a raw SQL query via Supabase's from() with a custom query
    const { data: rawData, error: rawError } = await supabase
      .from('service_plans')
      .select('*')
      .limit(0);
    
    if (rawError) {
      console.error('❌ Error:', rawError.message);
      console.error('Full error:', JSON.stringify(rawError, null, 2));
    } else {
      console.log('✅ Table accessible (but empty query)');
      console.log('Note: Cannot determine columns without data or RPC access');
    }
  } else {
    console.log('✅ Schema information retrieved:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Try to insert a test record to see what happens
  console.log('\n🧪 Attempting test insert...');
  const testData = {
    service_id: '00000000-0000-0000-0000-000000000001', // Fake ID for testing
    subscription_type_id: '00000000-0000-0000-0000-000000000001',
    age_group: 'child',
    funding_type: 'private',
    price: 100,
    currency: 'USD'
  };

  console.log('Test data:', JSON.stringify(testData, null, 2));

  const { data: insertData, error: insertError } = await supabase
    .from('service_plans')
    .insert(testData)
    .select();

  if (insertError) {
    console.log('❌ Insert failed (expected - using fake IDs):', insertError.message);
    console.log('Error details:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Insert succeeded:', insertData);
  }
}

checkActualSchema().catch(console.error);
