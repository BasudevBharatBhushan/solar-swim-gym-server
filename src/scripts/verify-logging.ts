
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT || 3001}/api/v1`;

async function verifyLogging() {
  console.log('--- LOGGING VERIFICATION START ---');
  console.log(`Targeting: ${API_BASE}`);

  try {
    // 0. Check Health
    console.log('Checking health...');
    const healthRes = await fetch('http://localhost:3001/health');
    const healthData = await healthRes.json() as any;
    console.log('Health Response:', JSON.stringify(healthData, null, 2));

    // 1. Login to get token
    console.log('Logging in...');
    const loginRes = await fetch(`${API_BASE}/auth/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@solar.com',
        password: 'password123'
      })
    });

    const loginData = await loginRes.json() as any;
    if (!loginData.token) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.token;
    const locationId = loginData.staff?.location_id;

    console.log('Login successful. Token acquired.');

    // 2. Trigger upsertService
    console.log('Sending request to /services...');
    const serviceRes = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        location_id: locationId,
        name: `Debug Service ${Date.now()}`,
        service_type: 'class'
      })
    });

    const serviceData = await serviceRes.json();
    console.log('Response status:', serviceRes.status);
    console.log('Response body:', JSON.stringify(serviceData, null, 2));

    console.log('--- LOGGING VERIFICATION END ---');
  } catch (err) {
    console.error('Test failed with error:', err);
  }
}

verifyLogging();
