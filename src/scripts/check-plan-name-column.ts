import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Checking if plan_name column exists in database...\n');

  // Try to select plan_name specifically
  console.log('Test 1: Trying to select plan_name column...');
  const { data: test1, error: error1 } = await supabase
    .from('service_plans')
    .select('plan_name')
    .limit(1);

  if (error1) {
    console.log('❌ Error selecting plan_name:', error1.message);
    console.log('   This suggests plan_name does NOT exist in the table ✅');
  } else {
    console.log('⚠️  plan_name column EXISTS in the database!');
    console.log('   Data:', test1);
  }

  // Try to select all columns
  console.log('\nTest 2: Selecting all columns...');
  const { data: test2, error: error2 } = await supabase
    .from('service_plans')
    .select('*')
    .limit(1);

  if (error2) {
    console.log('❌ Error:', error2.message);
  } else {
    if (test2 && test2.length > 0) {
      console.log('✅ Columns in first record:');
      console.log(Object.keys(test2[0]).join(', '));
    } else {
      console.log('✅ Table is empty (no records to show columns)');
    }
  }

  // Try to insert with plan_name to see what happens
  console.log('\nTest 3: Trying to insert WITH plan_name (should fail)...');
  const { data: test3, error: error3 } = await supabase
    .from('service_plans')
    .insert({
      service_id: '00000000-0000-0000-0000-000000000001',
      subscription_type_id: '00000000-0000-0000-0000-000000000001',
      plan_name: 'TEST',
      age_group: 'child',
      funding_type: 'private',
      price: 100,
      currency: 'USD'
    } as any)
    .select();

  if (error3) {
    console.log('❌ Insert with plan_name failed:', error3.message);
    if (error3.message.includes('plan_name')) {
      console.log('   ✅ Confirmed: plan_name column does NOT exist');
    }
  } else {
    console.log('⚠️  Insert with plan_name SUCCEEDED!');
    console.log('   This means plan_name column EXISTS in the database');
  }
}

checkTableStructure().catch(console.error);
