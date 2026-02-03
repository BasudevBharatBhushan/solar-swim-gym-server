import supabase from '../config/db';
import crmService from '../services/crm.service';
import elasticService from '../services/elastic.service';
import locationService from '../services/location.service';

const TEST_LOCATION_ID = '00000000-0000-0000-0000-000000000000';

async function setupTestData() {
  console.log('🚀 Starting Elasticsearch Test Setup...');

  // 1. Clear existing CRM data for test location
  console.log('🧹 Clearing CRM data...');
  await supabase.from('leads').delete().eq('location_id', TEST_LOCATION_ID);
  await supabase.from('profile').delete().eq('location_id', TEST_LOCATION_ID);
  await supabase.from('account').delete().eq('location_id', TEST_LOCATION_ID);
  
  // Ensure location exists
  await supabase.from('location').upsert({
    location_id: TEST_LOCATION_ID,
    name: 'Test Location Elastic',
    address: '123 Search Lane'
  });

  // 2. Clear and Recreate Elasticsearch Indices
  console.log('🗑️ Clearing Elasticsearch indices...');
  await elasticService.clearIndices();

  // 3. Add Test Leads
  console.log('📝 Adding test leads...');
  const leads = [
    { location_id: TEST_LOCATION_ID, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', mobile: '1234567890', status: 'NEW' },
    { location_id: TEST_LOCATION_ID, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@gmail.com', mobile: '9876543210', status: 'CONTACTED' },
    { location_id: TEST_LOCATION_ID, first_name: 'Robert', last_name: 'Brown', email: 'robert.b@outlook.com', mobile: '5556667777', status: 'NEW', notes: 'Interested in swimming' },
    { location_id: TEST_LOCATION_ID, first_name: 'Alice', last_name: 'Wonder', email: 'alice@wonderland.com', mobile: '1112223333', status: 'ARCHIVED' },
    { location_id: TEST_LOCATION_ID, first_name: 'Charlie', last_name: 'Chaplin', email: 'charlie@classic.com', mobile: '4445556666', status: 'NEW' }
  ];

  for (const lead of leads) {
    await crmService.upsertLead(lead);
  }

  // 4. Add Test Accounts and Profiles
  console.log('👤 Adding test accounts and profiles...');
  const accounts = [
    {
      location_id: TEST_LOCATION_ID,
      primary_profile: {
        location_id: TEST_LOCATION_ID,
        first_name: 'Michael',
        last_name: 'Jordan',
        email: 'mj@bulls.com',
        date_of_birth: '1963-02-17',
        is_primary: true
      },
      family_members: [
        {
          location_id: TEST_LOCATION_ID,
          first_name: 'Marcus',
          last_name: 'Jordan',
          date_of_birth: '1990-12-24',
          is_primary: false
        }
      ]
    },
    {
      location_id: TEST_LOCATION_ID,
      primary_profile: {
        location_id: TEST_LOCATION_ID,
        first_name: 'Serena',
        last_name: 'Williams',
        email: 'serena@tennis.com',
        date_of_birth: '1981-09-26',
        is_primary: true
      },
      family_members: [
        {
          location_id: TEST_LOCATION_ID,
          first_name: 'Olympia',
          last_name: 'Ohanian',
          date_of_birth: '2017-09-01',
          is_primary: false
        }
      ]
    }
  ];

  for (const acc of accounts) {
    // Manually create account first since upsertAccount requires it
    const { data: newAcc, error } = await supabase
      .from('account')
      .insert({ location_id: acc.location_id, status: 'ACTIVE' })
      .select('account_id')
      .single();
    
    if (error) throw new Error(error.message);
    
    await crmService.upsertAccount({ 
      ...acc, 
      account_id: newAcc.account_id 
    });
  }

  // Wait a bit for ES to refresh (indexing is near real-time)
  console.log('⏳ Waiting 4s for indexing...');
  await new Promise(resolve => setTimeout(resolve, 4000));

  // 5. Run Search Tests
  console.log('\n🔍 Running Search Tests...\n');

  // Test Lead Partial Search
  console.log('--- Lead Search: "Jo" (should find John) ---');
  const leadResult1 = await elasticService.searchLeads(TEST_LOCATION_ID, 'Jo');
  console.log(`Found: ${leadResult1.total}. Results:`, JSON.stringify(leadResult1.results, null, 2));

  console.log('\n--- Lead Search: "@gmail" (should find Jane) ---');
  const leadResult2 = await elasticService.searchLeads(TEST_LOCATION_ID, 'gmail');
  console.log(`Found: ${leadResult2.total}. Results:`, JSON.stringify(leadResult2.results, null, 2));

  // Test Account Partial Search
  console.log('\n--- Account Search: "Mich" (should find Michael Jordan) ---');
  const accResult1 = await elasticService.searchAccounts(TEST_LOCATION_ID, 'Mich');
  console.log(`Found: ${accResult1.total}. Results:`, JSON.stringify(accResult1.results, null, 2));

  console.log('\n--- Account Search: "Olymp" (should find Olympia - family member) ---');
  const accResult2 = await elasticService.searchAccounts(TEST_LOCATION_ID, 'Olymp');
  console.log(`Found: ${accResult2.total}. Results:`, JSON.stringify(accResult2.results, null, 2));

  // Test Sorting
  console.log('\n--- Lead Search Sort by name ASC ---');
  const leadResultSorted = await elasticService.searchLeads(TEST_LOCATION_ID, '', 0, 10, 'first_name.keyword', 'asc');
  console.log('First result:', (leadResultSorted.results[0] as any)?.first_name);

  console.log('\n✨ Elasticsearch testing complete!');
}

setupTestData().catch(err => {
  console.error('❌ Error testing Elasticsearch:', err);
  process.exit(1);
});
