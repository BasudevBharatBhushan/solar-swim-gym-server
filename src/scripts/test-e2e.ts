import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function runTest() {
  console.log('🚀 Starting Comprehensive E2E Test Workflow...');

  try {
    // Stage 0: Admin Setup via API
    console.log('\n--- Stage 0: Admin Setup (API) ---');

    // 1. Create Service
    const serviceRes = await axios.post(`${BASE_URL}/admin/services`, {
      service_name: 'E2E Test Swim Class',
      is_active: true
    });
    const serviceId = serviceRes.data.service_id;
    console.log('✅ POST /admin/services - Success');

    // 2. Create Membership
    const membershipRes = await axios.post(`${BASE_URL}/admin/memberships`, {
      membership_name: 'E2E Test Membership',
      description: 'Test membership created via API',
      is_active: true
    });
    const membershipId = membershipRes.data.membership_id;
    console.log('✅ POST /admin/memberships - Success');

    // 2b. Bundle Service with Membership
    await axios.post(`${BASE_URL}/admin/memberships/${membershipId}/services`, {
      serviceId: serviceId,
      accessType: 'CORE'
    });
    console.log('✅ POST /admin/memberships/:id/services - Success (Bundled Service)');

    // 2c. Verify Bundled Service (GET)
    const servicesRes = await axios.get(`${BASE_URL}/admin/memberships/${membershipId}/services`);
    const services = servicesRes.data;
    const bundledService = services.find((s: any) => s.service_id === serviceId);

    if (!bundledService || bundledService.access_type !== 'CORE') {
      throw new Error('Bundled service verification failed');
    }
    console.log('✅ GET /admin/memberships/:id/services - Success (Verified Bundle)');

    // 3. Create Subscription Type (Monthly)
    const subTypeRes = await axios.post(`${BASE_URL}/admin/subscription-types`, {
      type_name: 'E2E Monthly',
      billing_interval_unit: 'month',
      billing_interval_count: 1,
      auto_renew: true
    });
    const subTypeId = subTypeRes.data.subscription_type_id;
    console.log('✅ POST /admin/subscription-types - Success');

    // 4. Create Service Plan
    const servicePlanRes = await axios.post(`${BASE_URL}/admin/service-plans`, {
      service_id: serviceId,
      subscription_type_id: subTypeId,
      age_group: 'Child (6–12)',
      funding_type: 'private',
      price: 150.00,
      currency: 'INR'
    });
    console.log('✅ POST /admin/service-plans - Success');

    // 5. Create Membership Plan
    const membershipPlanRes = await axios.post(`${BASE_URL}/admin/membership-plans`, {
      membership_id: membershipId,
      subscription_type_id: subTypeId,
      age_group: 'Adult (18+)',
      funding_type: 'private',
      price: 4500.00,
      currency: 'INR'
    });
    const membershipPlanId = membershipPlanRes.data.membership_plan_id;
    console.log('✅ POST /admin/membership-plans - Success');

    // Stage 1: Onboarding
    console.log('\n--- Stage 1: User Onboarding ---');
    const testEmail = `e2e.test.${Date.now()}@example.com`;
    const onboardingPayload = {
      primary_profile: {
        first_name: 'E2E',
        last_name: 'User',
        email: testEmail,
        password: 'TemporaryPassword123',
        mobile: '9876543210',
        date_of_birth: '1995-05-15',
        rceb_flag: false
      },
      family_members: [
        {
          first_name: 'Child1',
          last_name: 'User',
          date_of_birth: '2018-01-01',
          rceb_flag: false
        }
      ]
    };

    const onboardRes = await axios.post(`${BASE_URL}/onboarding/complete`, onboardingPayload);
    console.log('✅ POST /onboarding/complete - Success');

    // Stage 2: Activation (via Debug Token)
    console.log('\n--- Stage 2: Account Activation ---');
    const tokensRes = await axios.get(`${BASE_URL}/debug/activation-tokens`);
    const myToken = tokensRes.data.tokens.find((t: any) => t.account?.email === testEmail);
    if (!myToken) throw new Error('Token not found');

    const activationToken = myToken.token;
    console.log(`Bypassing email... Found token: ${activationToken}`);

    await axios.post(`${BASE_URL}/auth/activation/activate`, {
      token: activationToken,
      password: 'SecurePassword123!'
    });
    console.log('✅ POST /auth/activation/activate - Success');

    // Stage 3: Login
    console.log('\n--- Stage 3: Login ---');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'SecurePassword123!'
    });
    const token = loginRes.data.token;
    const accountId = loginRes.data.user.account_id;
    const profileId = loginRes.data.user.profile_id;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ POST /auth/login - Success');

    // Stage 4: Subscriptions & Billing
    console.log('\n--- Stage 4: Subscription & Payment ---');

    // Create Subscription
    const subRes = await axios.post(`${BASE_URL}/subscriptions`, {
      accountId,
      profileId,
      membershipPlanId: membershipPlanId
    }, authHeaders);
    console.log('✅ POST /subscriptions - Success');

    // Get Invoices
    const invoicesRes = await axios.get(`${BASE_URL}/billing/invoices?accountId=${accountId}`, authHeaders);
    if (invoicesRes.data.invoices.length === 0) throw new Error('Invoice not generated');
    const invoiceId = invoicesRes.data.invoices[0].invoice_id;
    console.log(`✅ GET /billing/invoices - Found invoice: ${invoiceId}`);

    // Pay Invoice
    const payRes = await axios.post(`${BASE_URL}/billing/pay`, {
      invoiceId,
      accountId,
      paymentMethodId: 'pm_card_visa'
    }, authHeaders);
    console.log('✅ POST /billing/pay - Success');
    console.log('   Final Status:', payRes.data.invoice.status);

    console.log('\n✨ ALL E2E TESTS PASSED SUCCESSFULLY! ✨');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED!');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
    process.exit(1);
  }
}

runTest();
