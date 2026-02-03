/**
 * RBAC Setup and Test Script
 * 1. Bootstraps a SuperAdmin directly in DB
 * 2. Uses SuperAdmin to create 2 Admins via API
 * 3. Verifies RBAC for SuperAdmin, Admin, and User
 */

import supabase from '../config/db';
import bcrypt from 'bcryptjs';

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
};

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
    const data = await res.json();

    if (res.status >= 200 && res.status < 300) {
      console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
      return data;
    } else {
      console.log(`${colors.red}✗ Status: ${res.status}${colors.reset}`);
      console.log(`${colors.red}Error Response:${colors.reset}`, JSON.stringify(data, null, 2));
      return data;
    }
  } catch (err: any) {
    console.log(`${colors.red}✗ Failed: ${err.message}${colors.reset}`);
    return null;
  }
}

async function runRbacTests() {
  console.log(`${colors.bright}${colors.cyan}╔═══════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  RBAC SETUP & TEST SUITE              ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚═══════════════════════════════════════╝${colors.reset}`);

  // 1. Bootstrap SuperAdmin directly in DB
  console.log(`\n${colors.yellow}Step 1: Cleanup and Bootstrapping SuperAdmin...${colors.reset}`);
  let saEmail = `superadmin@solar.com`;
  let adminEmail1 = `admin1@location1.com`;
  let adminEmail2 = `admin2@location2.com`;
  let userEmail = `user@example.com`;

  // Delete existing records to avoid unique constraint violations
  await supabase.from('staff').delete().in('email', [saEmail, adminEmail1, adminEmail2]);
  
  // Note: We don't delete accounts/profiles here to avoid RLS/FK issues, 
  // but we can use unique emails for users or manually delete them if needed.

  const saPassword = 'password123';
  const saHash = await bcrypt.hash(saPassword, 10);

  const { data: saData, error: saError } = await supabase
    .from('staff')
    .insert({
      first_name: "Super",
      last_name: "Admin",
      email: saEmail,
      password_hash: saHash,
      role: 'SUPERADMIN',
      location_id: null
    })
    .select()
    .single();


  if (saError) {
    console.error("Failed to bootstrap SuperAdmin:", saError.message);
    process.exit(1);
  }
  console.log(`${colors.green}✓ SuperAdmin bootstrapped: ${saEmail}${colors.reset}`);

  // 2. Login as SuperAdmin to get Token
  const saLogin = await testApi('POST', '/auth/staff/login', {
    email: saEmail, password: saPassword
  }, "Login as SuperAdmin");
  
  if (!saLogin?.token) {
    console.error("Failed to login as SuperAdmin");
    process.exit(1);
  }

  const saToken = saLogin.token;
  const saHeaders = { 'Authorization': `Bearer ${saToken}` };

  // 3. Create 2 Locations using SuperAdmin token
  console.log(`\n${colors.yellow}Step 2: Creating 2 Locations via API...${colors.reset}`);
  const loc1 = await testApi('POST', '/locations', { name: "Location North" }, "Create Location 1", saHeaders);
  const loc2 = await testApi('POST', '/locations', { name: "Location South" }, "Create Location 2", saHeaders);

  if (!loc1?.location_id || !loc2?.location_id) {
    console.error("Failed to create locations.");
    process.exit(1);
  }

  const locId1 = loc1.location_id;
  const locId2 = loc2.location_id;


  // 4. Create 2 Admins via API using SuperAdmin token
  console.log(`\n${colors.yellow}Step 2: Creating 2 Admins via API...${colors.reset}`);
  
  adminEmail1 = `admin1@location1.com`;
  adminEmail2 = `admin2@location2.com`;

  const admin1 = await testApi('POST', '/auth/staff/create', {
    first_name: "Admin",
    last_name: "One",
    email: adminEmail1,
    password: "password123",
    role: "ADMIN",
    location_id: locId1
  }, "Create Admin 1 (Location North)", saHeaders);

  const admin2 = await testApi('POST', '/auth/staff/create', {
    first_name: "Admin",
    last_name: "Two",
    email: adminEmail2,
    password: "password123",
    role: "ADMIN",
    location_id: locId2
  }, "Create Admin 2 (Location South)", saHeaders);

  // 5. Verify Isolation: Admin 1 cannot access Location 2 data
  console.log(`\n${colors.yellow}Step 3: Verifying RBAC Isolation...${colors.reset}`);
  
  const admin1Login = await testApi('POST', '/auth/staff/login', {
    email: adminEmail1, password: "password123"
  }, "Login as Admin 1");
  const a1Token = admin1Login.token;
  const a1Headers = { 'Authorization': `Bearer ${a1Token}` };

  // Test: Admin 1 trying to list leads in Location 2 (should fail OR return empty if RLS works)
  // Actually, our middleware validateLocationAccess should block it if x-location-id is passed
  await testApi('GET', `/leads?location_id=${locId2}`, null, "Admin 1 Accessing Location 2 Leades (Should be blocked)", a1Headers);
  
  // Test: Admin 1 accessing its own location
  await testApi('GET', `/leads?location_id=${locId1}`, null, "Admin 1 Accessing Location 1 Leads (Should pass)", a1Headers);

  // 6. Test the new staff/all endpoint
  console.log(`\n${colors.yellow}Step 4: Verifying the new staff/all endpoint...${colors.reset}`);
  
  // SuperAdmin should be able to fetch all staff
  await testApi('GET', '/auth/staff/all', null, "SuperAdmin Fetching All Staff (Should pass)", saHeaders);
  
  // Admin 1 should be blocked from fetching all staff
  await testApi('GET', '/auth/staff/all', null, "Admin 1 Fetching All Staff (Should be blocked)", a1Headers);

  // 6. Test User Scope
  console.log(`\n${colors.yellow}Step 4: Verifying User Scope...${colors.reset}`);
  
  userEmail = `user@example.com`;
  // Using our debug endpoint to get a token if we registered before, 
  // or just register a new one
  const reg = await testApi('POST', '/auth/user/register', {
    location_id: locId1,
    primary_profile: {
      first_name: "Test",
      last_name: "User",
      email: userEmail,
      date_of_birth: "1995-01-01"
    }
  }, "Register User");

  const actToken = reg.activation_token;
  await testApi('POST', '/auth/user/activate', {
    token: actToken, password: "password123"
  }, "Activate User");

  const userLogin = await testApi('POST', '/auth/user/login', {
    email: userEmail, password: "password123"
  }, "User Login");

  const uToken = userLogin.token;
  const uHeaders = { 'Authorization': `Bearer ${uToken}` };

  // User trying to access Config (protected by requireAdmin for POST)
  await testApi('POST', '/config/age-groups', { name: "Forbidden Group", min_age: 1, max_age: 2 }, "User creating Age Group (Should be blocked)", uHeaders);
  
  // User accessing its own Account data
  await testApi('GET', '/accounts', null, "User viewing Accounts (Should return its own via RLS)", uHeaders);

  // User trying to fetch all staff
  await testApi('GET', '/auth/staff/all', null, "User Fetching All Staff (Should be blocked)", uHeaders);

  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.green}    RBAC TESTING COMPLETE${colors.reset}`);
  console.log(`${colors.bright}${colors.green}═══════════════════════════════════════${colors.reset}\n`);
}

runRbacTests().catch(console.error);
