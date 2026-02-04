
async function testMSUpdating() {
  const BASE_URL = 'http://localhost:3001/api/v1';
  
  try {
    // 1. Login as Admin
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin1@solar.com', password: 'password123' })
    });
    const { token, staff } = await loginRes.json();
    const locationId = staff.location_id;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Get a valid service ID from this location
    const servicesRes = await fetch(`${BASE_URL}/services`, { headers });
    const services = await servicesRes.json();
    if (services.length === 0) throw new Error('No services found');
    const serviceId = services[0].service_id;

    // 3. Create a Membership Service for Base Plan
    console.log('Creating Membership Service...');
    const createRes = await fetch(`${BASE_URL}/base-prices`, {
      method: 'POST', headers, body: JSON.stringify({
        location_id: locationId,
        membership_services: [{
          service_id: serviceId,
          is_included: true,
          usage_limit: 'Initial'
        }]
      })
    });
    let data = await createRes.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    if (!data.membership_services || data.membership_services.length === 0) {
      throw new Error('Membership services not returned in response');
    }
    const msId = data.membership_services[0].membership_service_id;
    console.log('Created MS ID:', msId);

    // 4. Update it using the ID
    console.log('Updating Membership Service using ID...');
    const updateRes = await fetch(`${BASE_URL}/base-prices`, {
      method: 'POST', headers, body: JSON.stringify({
        location_id: locationId,
        membership_services: [{
          membership_service_id: msId,
          service_id: serviceId,
          is_included: true,
          usage_limit: 'Updated via ID'
        }]
      })
    });
    data = await updateRes.json();
    const newMsId = data.membership_services[0].membership_service_id;
    const newLimit = data.membership_services[0].usage_limit;
    console.log('After update - ID:', newMsId, 'Limit:', newLimit);

    if (msId === newMsId && newLimit === 'Updated via ID') {
      console.log('SUCCESS: Membership Service updated correctly using ID.');
    } else {
      console.log('FAILURE: Update did not work as expected.');
    }

  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testMSUpdating();
