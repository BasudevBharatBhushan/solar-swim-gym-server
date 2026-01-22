import axios from 'axios';

const API_URL = 'http://localhost:3000/api/admin';

async function verifyBillingRoutes() {
  try {
    console.log('Starting Verification...');

    // 1. Create Subscription Types
    console.log('\nCreating Subscription Types...');
    const subTypes = [
      {
        type_name: 'Monthly',
        billing_interval_unit: 'month',
        billing_interval_count: 1,
        auto_renew: true,
        allows_pause: true,
        allows_cancel: true,
        generates_invoices: true
      },
      {
        type_name: '6-Month',
        billing_interval_unit: 'month',
        billing_interval_count: 6,
        auto_renew: false,
        allows_pause: false,
        allows_cancel: false,
        generates_invoices: true
      }
    ];

    let monthlyTypeId = '';

    for (const type of subTypes) {
      try {
        const res = await axios.post(`${API_URL}/subscription-types`, type);
        console.log(`Created ${type.type_name}:`, res.status === 201 ? 'Success' : 'Failed');
        if (type.type_name === 'Monthly') monthlyTypeId = res.data.subscription_type_id;
      } catch (err: any) {
        console.log(`Failed to create ${type.type_name} (might already exist):`, err.message);
        // If exists, likely we need to fetch it (not implemented in this script but fine for now)
      }
    }

    if (!monthlyTypeId) {
        console.error('Could not get Monthly Type ID. Aborting Service Plan test.');
        // Trying to fetch if create failed? No GET route implemented yet.
        // Assuming success or manual check needed if unique constraint hit.
        return;
    }

    // 2. Upsert Service Plan
    console.log('\nUpserting Service Plan (Swim 101, Monthly, 4-6, Self)...');
    const servicePlan = {
      service_id: '061c0df8-c1b1-4395-9c02-84d394545010', // From user image/mock
      subscription_type_id: monthlyTypeId,
      plan_name: 'PLAN.SWIM101.MONTHLY.4_6.SELF',
      price: 100.00,
      currency: 'USD',
      is_active: true,
      age_group: '4-6',
      funding_type: 'SELF'
    };

    const resPlan = await axios.post(`${API_URL}/service-plans`, servicePlan);
    console.log('Service Plan Upsert 1 (Create/Update):', resPlan.status === 200 ? 'Success' : 'Failed');
    console.log('Plan ID:', resPlan.data.service_plan_id);

    // 3. Upsert Same Plan with different price (Update)
    console.log('\nUpserting Same Plan with New Price (120.00)...');
    servicePlan.price = 120.00;
    const resPlanUpdate = await axios.post(`${API_URL}/service-plans`, servicePlan);
    console.log('Service Plan Upsert 2 (Update):', resPlanUpdate.status === 200 ? 'Success' : 'Failed');
    console.log('Updated Price (should be 120):', resPlanUpdate.data.price);

  } catch (error: any) {
    console.error('Verification Failed:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
  }
}

verifyBillingRoutes();
