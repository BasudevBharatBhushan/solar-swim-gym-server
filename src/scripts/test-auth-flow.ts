/**
 * Authentication Flow Test Script
 * Tests user registration, activation, and login flow
 */

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  step: string;
  success: boolean;
  error?: string;
}

const testResults: TestResult[] = [];
let testLocationId: string = '';
let testEmail: string = '';
let activationToken: string = '';
let userToken: string = '';
let staffToken: string = '';

async function testApi(
  method: string,
  endpoint: string,
  body: any = null,
  description: string,
  headers: Record<string, string> = {}
): Promise<any> {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${description}${colors.reset}`);
  console.log(`${colors.yellow}${method} ${endpoint}${colors.reset}`);
  
  if (body) {
    console.log(`${colors.cyan}Request Body:${colors.reset}`, JSON.stringify(body, null, 2));
  }

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const status = res.status;
    
    let data: any;
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }

    const success = status >= 200 && status < 300;
    
    if (success) {
      console.log(`${colors.green}✓ Status: ${status}${colors.reset}`);
      console.log(`${colors.green}Response:${colors.reset}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`${colors.red}✗ Status: ${status}${colors.reset}`);
      console.log(`${colors.red}Error Response:${colors.reset}`, JSON.stringify(data, null, 2));
    }

    testResults.push({
      step: description,
      success,
      error: success ? undefined : (data.error || data.message || 'Unknown error'),
    });

    return data;
  } catch (err: any) {
    console.log(`${colors.red}✗ Failed to connect${colors.reset}`);
    console.log(`${colors.red}Error: ${err.message}${colors.reset}`);
    
    testResults.push({
      step: description,
      success: false,
      error: err.message,
    });
    
    return null;
  }
}

async function setupTestLocation() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    SETUP: CREATE TEST LOCATION${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  const locationData = {
    name: "Test Location - Auth Flow " + Date.now(),
    address: "123 Test Street",
    city: "Test City",
    state: "CA",
    zip_code: "12345",
    phone: "555-0100",
    email: "test@example.com",
    timezone: "America/Los_Angeles"
  };
  
  const location = await testApi('POST', '/locations', locationData, 'Create Test Location');
  if (location && location.location_id) {
    testLocationId = location.location_id;
    console.log(`${colors.green}✓ Test location created: ${testLocationId}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Failed to create test location${colors.reset}`);
    process.exit(1);
  }
}

async function testUserRegistration() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    STEP 1: USER REGISTRATION${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  testEmail = `testuser.${Date.now()}@example.com`;

  const userData = {
    location_id: testLocationId,
    first_name: "John",
    last_name: "Doe",
    email: testEmail,
    date_of_birth: "1990-01-15",
    emergency_contact_name: "Jane Doe",
    emergency_contact_phone: "555-0102"
  };

  const result = await testApi('POST', '/auth/user/register', userData, 'Register New User');
  
  if (result && result.activation_token) {
    activationToken = result.activation_token;
    console.log(`${colors.green}✓ Registration successful${colors.reset}`);
    console.log(`${colors.green}✓ Activation token: ${activationToken}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Registration failed${colors.reset}`);
  }
}

async function testGetActivationToken() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    STEP 2: GET ACTIVATION TOKEN (Debug)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  const result = await testApi('POST', '/auth/user/get-activation-token', 
    { email: testEmail }, 
    'Get Activation Token for Testing'
  );
  
  if (result && result.token) {
    activationToken = result.token;
    console.log(`${colors.green}✓ Retrieved activation token: ${activationToken}${colors.reset}`);
  }
}

async function testAccountActivation() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    STEP 3: ACTIVATE ACCOUNT${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  const activationData = {
    token: activationToken,
    password: "SecurePassword123!"
  };

  const result = await testApi('POST', '/auth/user/activate', activationData, 'Activate Account & Set Password');
  
  if (result && result.success) {
    console.log(`${colors.green}✓ Account activated successfully${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Account activation failed${colors.reset}`);
  }
}

async function testUserLogin() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    STEP 4: USER LOGIN${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  const loginData = {
    email: testEmail,
    password: "SecurePassword123!"
  };

  const result = await testApi('POST', '/auth/user/login', loginData, 'User Login');
  
  if (result && result.token) {
    userToken = result.token;
    console.log(`${colors.green}✓ Login successful${colors.reset}`);
    console.log(`${colors.green}✓ JWT Token: ${userToken.substring(0, 50)}...${colors.reset}`);
    
    // Decode and display token payload
    const payload = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
    console.log(`${colors.cyan}Token Payload:${colors.reset}`, JSON.stringify(payload, null, 2));
  } else {
    console.log(`${colors.red}✗ Login failed${colors.reset}`);
  }
}

async function testStaffLogin() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    STEP 5: STAFF LOGIN (Expected to fail)${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);

  const loginData = {
    email: "admin@solar.com",
    password: "password123"
  };

  const result = await testApi('POST', '/auth/staff/login', loginData, 'Staff Login');
  
  if (result && result.token) {
    staffToken = result.token;
    console.log(`${colors.green}✓ Staff login successful${colors.reset}`);
    
    // Decode and display token payload
    const payload = JSON.parse(Buffer.from(staffToken.split('.')[1], 'base64').toString());
    console.log(`${colors.cyan}Token Payload:${colors.reset}`, JSON.stringify(payload, null, 2));
  }
}

function printSummary() {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`Total Steps: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

  if (failedTests > 0) {
    console.log(`\n${colors.red}Failed Steps:${colors.reset}`);
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  ${colors.red}✗${colors.reset} ${r.step} - ${r.error || 'Unknown error'}`);
    });
  }

  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}    TEST DATA${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  console.log(`Location ID: ${testLocationId}`);
  console.log(`Test Email: ${testEmail}`);
  console.log(`Activation Token: ${activationToken}`);
  console.log(`User JWT Token: ${userToken ? userToken.substring(0, 50) + '...' : 'N/A'}`);
}

async function runAuthFlowTests() {
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  AUTHENTICATION FLOW TEST SUITE       ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`);

  await setupTestLocation();
  await testUserRegistration();
  await testGetActivationToken();
  await testAccountActivation();
  await testUserLogin();
  await testStaffLogin();

  printSummary();
  
  const hasFailures = testResults.some(r => !r.success && !r.step.includes('Expected to fail'));
  process.exit(hasFailures ? 1 : 0);
}

runAuthFlowTests().catch(err => {
  console.error(err);
  process.exit(1);
});
