
async function testAdminUpdate() {
  const BASE_URL = 'http://localhost:3001/api/v1';
  
  try {
    // 1. Login as Admin
    console.log('Logging in as Admin...');
    const loginRes = await fetch(`${BASE_URL}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin1@solar.com', password: 'password123' })
    });
    const { token, staff } = await loginRes.json();
    const locationId = staff.location_id;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Clear existing base prices for this location to start clean
    // (We can't easily clear via API, so we just create a new one)
    console.log('Creating a Base Price...');
    const createRes = await fetch(`${BASE_URL}/base-prices`, {
      method: 'POST', headers, body: JSON.stringify({
        location_id: locationId,
        prices: [{
          name: 'Test Admin Fee',
          role: 'PRIMARY',
          age_group_id: '2822e9e4-a901-4445-9607-d2af1528db3a', // From common seed
          subscription_term_id: '4741604d-5013-43da-9d5f-1c361f70981d', // From common seed
          price: 15.00
        }]
      })
    });
    let data = await createRes.json();
    const originalId = data.prices[0].base_price_id;
    console.log('Original ID:', originalId);

    // 3. Update it
    console.log('Updating it...');
    const updateRes = await fetch(`${BASE_URL}/base-prices`, {
      method: 'POST', headers, body: JSON.stringify({
        location_id: locationId,
        prices: [{
          base_price_id: originalId,
          name: 'Updated Admin Fee',
          role: 'PRIMARY',
          age_group_id: '2822e9e4-a901-4445-9607-d2af1528db3a',
          subscription_term_id: '4741604d-5013-43da-9d5f-1c361f70981d',
          price: 25.00
        }]
      })
    });
    data = await updateRes.json();
    const newId = data.prices[0].base_price_id;
    console.log('New ID:', newId);
    
    if (originalId === newId) {
      console.log('SUCCESS: Admin update worked, ID preserved.');
    } else {
      console.log('FAILURE: Admin update resulted in new ID!');
    }

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testAdminUpdate();
