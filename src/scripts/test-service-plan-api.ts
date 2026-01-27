import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function testServicePlanAPI() {
  console.log('🧪 Testing Service Plan API...\n');

  try {
    // 1. Create Service
    console.log('1. Creating service...');
    const serviceRes = await axios.post(`${BASE_URL}/admin/services`, {
      service_name: 'API Test Service',
      is_active: true
    });
    const serviceId = serviceRes.data.service_id;
    console.log('✅ Service created:', serviceId);

    // 2. Create Subscription Type
    console.log('\n2. Creating subscription type...');
    const subTypeRes = await axios.post(`${BASE_URL}/admin/subscription-types`, {
      type_name: 'API Test Monthly ' + Date.now(),
      billing_interval_unit: 'month',
      billing_interval_count: 1,
      auto_renew: true
    });
    const subTypeId = subTypeRes.data.subscription_type_id;
    console.log('✅ Subscription type created:', subTypeId);

    // 3. Create Service Plan
    console.log('\n3. Creating service plan...');
    const planPayload = {
      service_id: serviceId,
      subscription_type_id: subTypeId,
      age_group: 'child',
      funding_type: 'private',
      price: 150.00,
      currency: 'INR'
    };
    
    console.log('Payload:', JSON.stringify(planPayload, null, 2));
    
    const planRes = await axios.post(`${BASE_URL}/admin/service-plans`, planPayload);
    console.log('✅ Service plan created:', planRes.data.service_plan_id);
    console.log('Response:', JSON.stringify(planRes.data, null, 2));

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testServicePlanAPI();
