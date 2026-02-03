async function test() {
  const API_BASE = 'http://localhost:3001/api/v1';
  
  // 1. Login
  const loginRes = await fetch(`${API_BASE}/auth/staff/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@solar.com', password: 'password123' })
  });
  const { token } = await loginRes.json();
  
  // 2. Create
  const createRes = await fetch(`${API_BASE}/config/subscription-terms`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location_id: '0ffa906a-63b1-4066-92af-277c1567baee',
      name: 'Test Update',
      duration_months: 1,
      payment_mode: 'RECURRING'
    })
  });
  const { subscription_term_id } = await createRes.json();
  console.log('Created ID:', subscription_term_id);

  // 3. Update
  const updateRes = await fetch(`${API_BASE}/config/subscription-terms`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription_term_id,
      location_id: '0ffa906a-63b1-4066-92af-277c1567baee',
      name: 'Updated Name SUCCESS',
      duration_months: 6,
      payment_mode: 'PAY_IN_FULL'
    })
  });
  const updated = await updateRes.json();
  console.log('Updated Name:', updated.name);
  console.log('Updated Months:', updated.duration_months);
  console.log('Updated Mode:', updated.payment_mode);
}
test();
