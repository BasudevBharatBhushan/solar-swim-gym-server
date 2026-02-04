
async function testPayload() {
  const BASE_URL = 'http://localhost:3001/api/v1';
  
  try {
    // 1. Login as SuperAdmin
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@solar.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 2. Initial Setup
    console.log('Setting up prerequisite data...');
    const locRes = await fetch(`${BASE_URL}/locations`, {
      method: 'POST', headers, body: JSON.stringify({ name: 'Test Payloads Loc' })
    });
    const locData = await locRes.json();
    const locationId = locData.location_id;

    const agRes = await fetch(`${BASE_URL}/config/age-groups`, {
      method: 'POST', headers, body: JSON.stringify({ name: 'Payload Adult', min_age: 18, max_age: 60 })
    });
    const agData = await agRes.json();
    const ageGroupId = agData.age_group_id;

    const termRes = await fetch(`${BASE_URL}/config/subscription-terms`, {
      method: 'POST', headers, body: JSON.stringify({ location_id: locationId, name: 'Monthly P', duration_months: 1 })
    });
    const termData = await termRes.json();
    const termId = termData.subscription_term_id;

    const svcRes = await fetch(`${BASE_URL}/services`, {
      method: 'POST', headers, body: JSON.stringify({ location_id: locationId, name: 'Payload Service', service_type: 'class' })
    });
    const svcData = await svcRes.json();
    const serviceId = svcData.service_id;

    // 3. Test the User's Payload
    console.log('\n--- Testing User Payload ---');
    const userPayload = {
        "location_id": locationId,
        "prices": [
            {
                "location_id": locationId,
                "name": "Ultra-Standard Monthly Fee",
                "role": "PRIMARY",
                "age_group_id": ageGroupId,
                "subscription_term_id": termId,
                "price": 29.99
            }
        ],
        "membership_services": [
            {
                "service_id": serviceId,
                "is_included": true,
                "is_part_of_base_plan": true,
                "membership_program_id": null,
                "usage_limit": "Unlimited",
                "discount": "10%"
            }
        ]
    };

    const payloadRes = await fetch(`${BASE_URL}/base-prices`, {
      method: 'POST', headers, body: JSON.stringify(userPayload)
    });
    const resData = await payloadRes.json();

    if (payloadRes.ok) {
      console.log('SUCCESS! Payload accepted.');
      console.log('Response Structure Keys:', Object.keys(resData));
      console.log('Prices Count:', resData.prices.length);
      console.log('Membership Services Count:', resData.membership_services.length);
    } else {
      console.error('FAILED! Payload rejected.');
      console.error('Status:', payloadRes.status);
      console.error('Error Details:', JSON.stringify(resData, null, 2));
    }

  } catch (err) {
    console.error('Setup failed:', err.message);
  }
}

testPayload();

testPayload();
