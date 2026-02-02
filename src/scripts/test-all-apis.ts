/**
 * Comprehensive API Test Script
 * Tests all endpoints and RBAC scopes: SuperAdmin, Admin, and User
 */

const BASE_URL = 'http://localhost:3001';
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
  const tempLocId = newLoc?.location_id;

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

  // Admin 1 can list leads (should only see Loc 1 via RLS, or if they pass correct header)
  await testApi('GET', `/leads?location_id=${locId1}`, null, 'Admin 1 lists Loc 1 leads', a1Headers, 'ADMIN');

  // 4. USER SCOPE
  console.log(`\n${colors.bright}Phase 4: User Scope${colors.reset}`);
  
  // Register a new user
  const userEmail = `user.${Date.now()}@test.com`;
  const reg = await testApi('POST', '/auth/user/register', {
    location_id: locId1,
    first_name: 'John',
    last_name: 'User',
    email: userEmail,
    date_of_birth: '1990-01-01'
  }, 'Register New User', {}, 'ANONYMOUS');

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

      // User can see their own accounts
      await testApi('GET', '/accounts', null, 'User can view their own accounts', uHeaders, 'USER');

      // User CANNOT list leads
      await testApi('GET', '/leads', null, 'User trying to list leads (Should Fail)', uHeaders, 'USER', false);

      // User CANNOT create a new location
      await testApi('POST', '/locations', { name: 'User Location' }, 'User trying to create location (Should Fail)', uHeaders, 'USER', false);
    }
  }

  // 5. SUMMARY
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
