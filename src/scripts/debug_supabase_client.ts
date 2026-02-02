
import supabase from '../config/db';

async function test() {
  console.log('------------------------------------------------');
  console.log('DEBUG: Testing Supabase Client Connection & RLS');
  console.log('------------------------------------------------');
  
  // Test 1: Simple Select
  console.log('\n1. Selecting from "location"...');
  const { data, error } = await supabase.from('location').select('*');
  
  if (error) {
    console.error('❌ Select Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Select Success. Count:', data?.length);
    if (data && data.length > 0) {
      console.log('Sample Data:', data[0]);
    } else {
      console.log('Data is empty array (RLS might be blocking or table empty)');
    }
  }

  // Test 2: Insert (if select worked or failed)
  console.log('\n2. Attempting Insert into "location"...');
  const payload = {
    name: "Debug Location " + Date.now(),
    address: "Debug St",
    city: "Debug City", // Configured as non-nullable?
    state: "CA",
    zip_code: "00000",
    phone: "000-000-0000",
    email: "debug@example.com",
    timezone: "UTC"
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('location')
    .insert(payload)
    .select();
    
  if (insertError) {
    console.error('❌ Insert Error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Insert Success:', insertData);
  }
}

test().catch(e => console.error('Script Error:', e));
