
async function testUpdateLogic() {
  const BASE_URL = 'http://localhost:3001/api/v1';
  
  try {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@solar.com', password: 'password123' })
    });
    const { token } = await loginRes.json();
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Setup
    console.log('Setup data...');
    const locRes = await fetch(`${BASE_URL}/locations`, { method: 'POST', headers, body: JSON.stringify({ name: 'Update Test Loc' }) });
    const { location_id } = await locRes.json();
    const agRes = await fetch(`${BASE_URL}/config/age-groups`, { method: 'POST', headers, body: JSON.stringify({ name: 'Update Ag', min_age: 1, max_age: 10 }) });
    const { age_group_id } = await agRes.json();
    const termRes = await fetch(`${BASE_URL}/config/subscription-terms`, { method: 'POST', headers, body: JSON.stringify({ location_id, name: 'Update Term', duration_months: 1 }) });
    const { subscription_term_id } = await termRes.json();

    // 3. Create initial base price
    console.log('\n--- Creating Initial Base Price ---');
    const createPayload = {
      location_id,
      prices: [{
        name: 'Initial Fee',
        role: 'PRIMARY',
        age_group_id,
        subscription_term_id,
        price: 10.00
      }]
    };
    const createRes = await fetch(`${BASE_URL}/base-prices`, { method: 'POST', headers, body: JSON.stringify(createPayload) });
    let data = await createRes.json();
    const originalPriceId = data.prices[0].base_price_id;
    console.log('Original ID:', originalPriceId);

    // 4. Attempt Update
    console.log('\n--- Attempting Update with same ID ---');
    const updatePayload = {
      location_id,
      prices: [{
        base_price_id: originalPriceId,
        name: 'Updated Fee',
        role: 'PRIMARY',
        age_group_id,
        subscription_term_id,
        price: 20.00
      }]
    };
    const updateRes = await fetch(`${BASE_URL}/base-prices`, { method: 'POST', headers, body: JSON.stringify(updatePayload) });
    data = await updateRes.json();
    const newPriceId = data.prices[0].base_price_id;
    console.log('New ID:', newPriceId);

    if (originalPriceId === newPriceId) {
      console.log('SUCCESS: ID remained the same.');
    } else {
      console.log('FAILURE: ID changed!');
    }

    // Check row count in response
    console.log('Total prices in response:', data.prices.length);

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testUpdateLogic();
