const API_BASE = 'http://localhost:3001/api/v1';

async function testUpdate() {
  console.log('🧪 Testing Subscription Term Update...');

  // 1. Get a token
  const loginRes = await fetch(`${API_BASE}/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@solar.com',
      password: 'password123'
    })
  });
  
  // Wait, I need to check the exact path for login
  // Looking at postman_collection.json: {{baseUrl}}/auth/staff/login
  // So it's /api/v1/auth/staff/login
  
  const loginResFull = await fetch(`${API_BASE}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@solar.com',
      password: 'password123'
    })
  });

  const loginData = await loginResFull.json();
  const token = loginData.token;
  if (!token) {
    console.error('Login failed:', loginData);
    return;
  }
  const headers = { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 2. Get a valid location
  const locRes = await fetch(`${API_BASE}/locations`, { headers });
  const locData = await locRes.json();
  const location_id = locData[0].location_id;
  console.log(`Using location: ${location_id}`);

  // 3. Create a term
  const createRes = await fetch(`${API_BASE}/config/subscription-terms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      location_id,
      name: 'Initial Name',
      duration_months: 3,
      payment_mode: 'RECURRING'
    })
  });

  const createData = await createRes.json();
  const termId = createData.subscription_term_id;
  console.log(`Created term with ID: ${termId}`);

  // 4. Update the term (Provide the ID)
  console.log('Updating term name to "Updated Name"...');
  const updateRes = await fetch(`${API_BASE}/config/subscription-terms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subscription_term_id: termId,
      location_id,
      name: 'Updated Name',
      duration_months: 3,
      payment_mode: 'RECURRING'
    })
  });

  const updateData = await updateRes.json();
  if (updateData.name === 'Updated Name') {
    console.log('✅ Update successful! Name is now "Updated Name"');
  } else {
    console.error('❌ Update failed! Data:', updateData);
  }

  // 5. Test PAY_IN_FULL
  console.log('Testing PAY_IN_FULL mode...');
  const pifRes = await fetch(`${API_BASE}/config/subscription-terms`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      location_id,
      name: 'Annual PIF Test',
      duration_months: 12,
      payment_mode: 'PAY_IN_FULL'
    })
  });

  const pifData = await pifRes.json();
  if (pifData.payment_mode === 'PAY_IN_FULL') {
    console.log('✅ PAY_IN_FULL works!');
  } else {
    console.error('❌ PAY_IN_FULL failed! payment_mode:', pifData.payment_mode);
  }
}

testUpdate().catch(err => {
  console.error('Test failed with error:', err);
});
