import { supabase } from '../config/supabase';

async function checkSchema() {
  console.log('🔍 Checking service_plans table schema...\n');

  // Try to query the table with all expected columns
  const { data, error } = await supabase
    .from('service_plans')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Query successful');
    if (data && data.length > 0) {
      console.log('\n📋 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📋 Available columns:');
      console.log(Object.keys(data[0]).join(', '));
    } else {
      console.log('\n📋 Table is empty');
    }
  }

  // Try to query information_schema to see actual columns
  console.log('\n🔍 Querying PostgreSQL information_schema...');
  const { data: columns, error: colError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'service_plans'
      ORDER BY ordinal_position;
    `
  });

  if (colError) {
    console.log('⚠️  Could not query information_schema (RPC might not be available)');
    console.log('Error:', colError.message);
  } else {
    console.log('✅ Columns in service_plans table:');
    console.log(columns);
  }
}

checkSchema().catch(console.error);
