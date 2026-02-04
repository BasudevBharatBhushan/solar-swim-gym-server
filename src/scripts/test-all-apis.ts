/**
 * Comprehensive API Test Script
 * Tests all endpoints and RBAC scopes: SuperAdmin, Admin, and User
 */

const BASE_URL = 'http://127.0.0.1:3001';
const API_BASE = `${BASE_URL}/api/v1`;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  expected: boolean;
  role: string;
  description: string;
  error?: string;
}

const testResults: TestResult[] = [];

async function testApi(
  method: string,
  endpoint: string,
  body: any = null,
  description: string,
  headers: Record<string, string> = {},
  role: string = 'ANONYMOUS',
  expectSuccess: boolean = true
): Promise<any> {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Role: ${role} | ${description}${colors.reset}`);
  console.log(`${colors.yellow}${method} ${endpoint}${colors.reset}`);
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const status = res.status;
    
    let data: any;
    try {
      data = await res.json();
    } catch {
      data = { message: 'Non-JSON response' };
    }

    const actuallySucceeded = status >= 200 && status < 300;
    const testPassed = actuallySucceeded === expectSuccess;
    
    if (testPassed) {
      console.log(`${colors.green}✓ Test Passed (Status: ${status})${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Test Failed! (Status: ${status}, Expected Success: ${expectSuccess})${colors.reset}`);
      console.log(`${colors.red}Response:${colors.reset}`, JSON.stringify(data, null, 2));
    }

    testResults.push({
      endpoint,
      method,
      status,
      success: testPassed,
      expected: expectSuccess,
      role,
      description,
      error: actuallySucceeded ? undefined : (data.error || data.message || 'Unknown error')
    });

    return data;
  } catch (err: any) {
    console.log(`${colors.red}✗ Connection Failed: ${err.message}${colors.reset}`);
    testResults.push({
      endpoint,
      method,
      status: 0,
      success: false,
      expected: expectSuccess,
      role,
      description,
      error: err.message
    });
    return null;
  }
}

async function runTests() {
  console.log(`${colors.bright}${colors.magenta}╔════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║       COMPREHENSIVE RBAC TEST SUITE        ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════╝${colors.reset}`);

  // 1. LOGIN
  console.log(`\n${colors.bright}Phase 1: Authentication${colors.reset}`);
  
  const saLogin = await testApi('POST', '/auth/staff/login', {
    email: 'superadmin@solar.com', password: 'password123'
  }, 'SuperAdmin Login', {}, 'SUPERADMIN');
  
  const a1Login = await testApi('POST', '/auth/staff/login', {
    email: 'admin1@solar.com', password: 'password123'
  }, 'Admin 1 Login', {}, 'ADMIN');

  const a2Login = await testApi('POST', '/auth/staff/login', {
    email: 'admin2@solar.com', password: 'password123'
  }, 'Admin 2 Login', {}, 'ADMIN');

  if (!saLogin?.token || !a1Login?.token || !a2Login?.token) {
    console.error('Critical logins failed. Check if server is running and data is seeded.');
    process.exit(1);
  }

  const saToken = saLogin.token;
  const a1Token = a1Login.token;
  const a2Token = a2Login.token;

  const saHeaders = { 'Authorization': `Bearer ${saToken}` };
  const a1Headers = { 'Authorization': `Bearer ${a1Token}` };
  const a2Headers = { 'Authorization': `Bearer ${a2Token}` };

  const locId1 = a1Login.staff?.location_id || a1Login.user?.location_id;
  const locId2 = a2Login.staff?.location_id || a2Login.user?.location_id;

  // 2. SUPERADMIN SCOPE
  console.log(`\n${colors.bright}Phase 2: SuperAdmin Capabilities${colors.reset}`);
  
  await testApi('GET', '/locations', null, 'SuperAdmin can list all locations', saHeaders, 'SUPERADMIN');
  
  const newLoc = await testApi('POST', '/locations', { name: 'New Test Location' }, 'SuperAdmin can create location', saHeaders, 'SUPERADMIN');

  await testApi('GET', '/auth/staff/all', null, 'SuperAdmin can fetch all staff', saHeaders, 'SUPERADMIN');
  await testApi('GET', '/auth/staff/all', null, 'Admin 1 cannot fetch all staff', a1Headers, 'ADMIN', false);

  // 3. ADMIN SCOPE & ISOLATION
  console.log(`\n${colors.bright}Phase 3: Admin Scope & Isolation${colors.reset}`);
  
  // Admin 1 can create a lead in their own location
  const lead1 = await testApi('POST', '/leads', {
    first_name: 'Lead', last_name: 'One', email: 'lead1@test.com', location_id: locId1
  }, 'Admin 1 creates lead in Loc 1', a1Headers, 'ADMIN');

  // Admin 1 SHOULD NOT be able to create a lead in Admin 2's location
  await testApi('POST', '/leads', {
    first_name: 'Lead', last_name: 'Two', email: 'lead2@test.com', location_id: locId2
  }, 'Admin 1 trying to create lead in Loc 2 (Should Fail)', a1Headers, 'ADMIN', false);

  // Admin 1 can list leads
  await testApi('GET', `/leads?location_id=${locId1}`, null, 'Admin 1 lists Loc 1 leads', a1Headers, 'ADMIN');

  // --- NEW: CONFIG, PRICING, & MEMBERSHIPS ---
  console.log(`\n${colors.bright}Phase 3.5: Configuration, Pricing & Memberships${colors.reset}`);

  // 1. Config: Age Group (Global) & Term (Local)
  const ageGroup = await testApi('POST', '/config/age-groups', {
    name: 'Adult Test', min_age: 18.5, max_age: 99.5
  }, 'Admin 1 creates Age Group (Decimal ages)', saHeaders, 'SUPERADMIN'); 

  const subTerm = await testApi('POST', '/config/subscription-terms', {
    location_id: locId1, name: 'Monthly Test', duration_months: 1, payment_mode: 'RECURRING'
  }, 'Admin 1 creates Subscription Term', a1Headers, 'ADMIN');

  await testApi('POST', '/config/subscription-terms', {
    location_id: locId1, name: 'Full Pay Test', duration_months: 12, payment_mode: 'PAY_IN_FULL'
  }, 'Admin 1 creates Pay In Full Term', a1Headers, 'ADMIN');

  const ageGroupId = ageGroup?.age_group_id;
  const termId = subTerm?.subscription_term_id;

  if (ageGroupId && termId) {
      // 2. Base Plan
      const basePlan = await testApi('POST', '/base-prices', {
          location_id: locId1,
          prices: [{
              name: 'Standard Base Fee',
              role: 'PRIMARY',
              age_group_id: ageGroupId,
              subscription_term_id: termId,
              price: 29.99
          }],
          membership_services: []
      }, 'Admin 1 upserts Base Plan', a1Headers, 'ADMIN');

      const fetchedPlan = await testApi('GET', `/base-prices?location_id=${locId1}`, null, 'Admin 1 gets Base Plan', a1Headers, 'ADMIN');
      
      // Verification
      if (fetchedPlan && (!fetchedPlan.prices || !fetchedPlan.membership_services)) {
          console.error('Base Plan response missing expected root keys!');
      }

      // 3. Service with Pricing
      const service = await testApi('POST', '/services', {
          location_id: locId1,
          name: 'Yoga Class',
          service_type: 'class',
          pricing_structure: [
              {
                  age_group_id: ageGroupId,
                  terms: [{ subscription_term_id: termId, price: 15.00 }]
              }
          ]
      }, 'Admin 1 creates Service with Pricing', a1Headers, 'ADMIN');
      const serviceId = service?.service_id;

      if (serviceId) {
          await testApi('GET', `/services/${serviceId}`, null, 'Admin 1 gets specific Service by ID', a1Headers, 'ADMIN');
      }

      // 4. Membership Program
      if (serviceId) {
        const membership = await testApi('POST', '/memberships', {
            location_id: locId1,
            name: 'Gold Membership',
            categories: [
                {
                    name: 'Individual',
                    fees: [
                        { fee_type: 'JOINING', billing_cycle: 'ONE_TIME', amount: 50.00 }
                    ],
                    rules: [
                        { priority: 1, result: 'ALLOW', message: 'Adult Policy', condition_json: { minAdult: 1, maxAdult: 1 } },
                        { priority: 2, result: 'ALLOW', message: 'Child Policy', condition_json: { minChild: 0, maxChild: 2 } }
                    ]
                }
            ],
            services: [
                { service_id: serviceId, is_included: true }
            ]
        }, 'Admin 1 creates Membership Program with split rules', a1Headers, 'ADMIN');
        
        const membershipId = membership?.membership_program_id;

        if (membershipId) {
            await testApi('GET', `/memberships/${membershipId}`, null, 'Admin 1 gets specific Membership Program by ID', a1Headers, 'ADMIN');
        }
      }
  }

  // 4. USER SCOPE & REGISTRATION
  console.log(`\n${colors.bright}Phase 4: User Scope & Complex Registration${colors.reset}`);
  
  // Complex Register with Family
  const userEmail = `user.${Date.now()}@test.com`;
  const reg = await testApi('POST', '/auth/user/register', {
    location_id: locId1,
    primary_profile: {
        first_name: 'John',
        last_name: 'User',
        email: userEmail,
        date_of_birth: '1990-01-01',
        emergency_contact_name: 'Safe Person',
        emergency_contact_phone: '555-1234',
        waiver_program_id: null,
        case_manager_name: null
    },
    family_members: [
        {
            first_name: 'Jane',
            last_name: 'User',
            date_of_birth: '2015-05-05',
            waiver_program_id: null
        }
    ]
  }, 'Register Complex User with Family member', {}, 'ANONYMOUS');

  if (reg?.activation_token) {
    await testApi('POST', '/auth/user/activate', {
      token: reg.activation_token, password: 'password123'
    }, 'Activate User', {}, 'ANONYMOUS');

    const uLogin = await testApi('POST', '/auth/user/login', {
      email: userEmail, password: 'password123'
    }, 'User Login', {}, 'USER');

    if (uLogin?.token) {
      const uToken = uLogin.token;
      const uHeaders = { 'Authorization': `Bearer ${uToken}` };
      const accountId = reg.account_id;
      const profileId = reg.profile_id;

      // 5. BILLING & SUBSCRIPTIONS
      console.log(`\n${colors.bright}Phase 5: Billing & Subscriptions${colors.reset}`);

      // Create Subscription
      const sub = await testApi('POST', '/billing/subscriptions', {
          account_id: accountId,
          location_id: locId1,
          subscription_type: 'BASE',
          reference_id: termId, // Using valid termId from earlier
          subscription_term_id: termId,
          unit_price_snapshot: 29.99,
          total_amount: 29.99,
          billing_period_start: '2024-02-01',
          billing_period_end: '2024-03-01',
          coverage: [
              { profile_id: profileId, role: 'PRIMARY' }
          ]
      }, 'User creates Subscription', uHeaders, 'USER');

      // Get subscriptions
      await testApi('GET', `/billing/accounts/${accountId}/subscriptions`, null, 'User views their subscriptions', uHeaders, 'USER');
    }
  }

  // 6. DISCOUNT CODES
  console.log(`\n${colors.bright}Phase 6: Discount Codes${colors.reset}`);
  
  // Admin 1 creates a discount code
  const discountCode = `TEST${Date.now()}`;
  await testApi('POST', '/discounts', {
    discount_code: discountCode,
    discount: '6%',
    staff_name: 'Admin One'
  }, 'Admin 1 creates a discount code', a1Headers, 'ADMIN');

  // Admin 1 can list codes
  await testApi('GET', `/discounts`, null, 'Admin 1 lists discount codes', a1Headers, 'ADMIN');

  // Anyone (authenticated) can validate a code
  await testApi('GET', `/discounts/validate/${discountCode}`, null, 'User validates a discount code', a1Headers, 'ADMIN');

  // Admin 2 should not see Admin 1's discount codes (if isolated)
  // Note: RLS usually handles this, so we check if it is filtered.
  const a2Discounts = await testApi('GET', `/discounts`, null, 'Admin 2 lists their own discount codes', a2Headers, 'ADMIN');
  const foundInA2 = a2Discounts?.data?.find((d: any) => d.discount_code === discountCode);
  
  testResults.push({
    endpoint: '/discounts',
    method: 'GET',
    status: 200,
    success: !foundInA2,
    expected: true,
    role: 'ADMIN',
    description: 'Discount code isolation check (Admin 2 should not see Admin 1 code)',
    error: foundInA2 ? 'Isolation failed: Admin 2 saw Admin 1 data' : undefined
  });

  // 7. SUMMARY
  printSummary();
}

function printSummary() {
  console.log(`\n${colors.bright}${colors.magenta}════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║               TEST SUMMARY                 ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚════════════════════════════════════════════╝\n`);

  const total = testResults.length;
  const passed = testResults.filter(r => r.success).length;
  const failed = total - passed;

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed > 0) {
    console.log(`\n${colors.red}Failed Details:${colors.reset}`);
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  ${colors.red}✗${colors.reset} [${r.role}] ${r.method} ${r.endpoint}: ${r.description}`);
      console.log(`    Error: ${r.error}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
