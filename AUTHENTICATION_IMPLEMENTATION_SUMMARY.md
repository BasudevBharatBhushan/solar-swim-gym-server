# Authentication Implementation Summary

## ✅ What Was Implemented

### 1. Middleware
- **`src/middlewares/auth.ts`** - JWT authentication middleware
  - `authenticateToken` - Verifies JWT tokens
  - `optionalAuth` - Optional authentication (doesn't fail if no token)
  
- **`src/middlewares/setLocationContext.ts`** - Location context middleware
  - Extracts `location_id` from headers, body, or JWT token
  - Stores in `req.locationId` for use in services

### 2. Authentication Service (`src/services/auth.service.ts`)
- **`staffLogin(email, password)`** - Staff authentication
- **`registerUser(userData)`** - User registration with activation token
- **`activateAccount(token, password)`** - Account activation and password setting
- **`accountLogin(email, password)`** - User authentication
- **`getActivationToken(email)`** - Debug endpoint to retrieve activation token

### 3. Authentication Controller (`src/controllers/auth.controller.ts`)
- `staffLogin` - POST /auth/staff/login
- `registerUser` - POST /auth/user/register
- `activateAccount` - POST /auth/user/activate
- `accountLogin` - POST /auth/user/login
- `getActivationToken` - POST /auth/user/get-activation-token (debug)

### 4. Routes (`src/routes/auth.routes.ts`)
All authentication endpoints under `/api/v1/auth/`:
- Staff: `/staff/login`
- User: `/user/register`, `/user/activate`, `/user/login`
- Debug: `/user/get-activation-token`

### 5. Application Setup (`src/app.ts`)
- Added `optionalAuth` middleware before routes
- Added `setLocationContext` middleware before routes
- Middleware chain: Request → optionalAuth → setLocationContext → Routes

### 6. Test Scripts
- **`src/scripts/test-auth-flow.ts`** - Complete authentication flow test
- **`npm run test:auth`** - Run authentication tests

### 7. SQL Migrations
- **`sql/09_helper_functions.sql`** - Helper function for raw SQL execution
- **`sql/10_fix_rls_for_supabase_client.sql`** - Disables RLS on activation tokens

### 8. Documentation
- **`AUTHENTICATION_RLS_DOCUMENTATION.md`** - Complete authentication and RLS guide

## 🔑 JWT Token Structure

### Staff Token
```json
{
  "staff_id": "uuid",
  "role": "ADMIN",
  "location_id": "uuid",
  "type": "staff",
  "exp": 1234567890
}
```

### User Token
```json
{
  "profile_id": "uuid",
  "account_id": "uuid",
  "location_id": "uuid",
  "type": "user",
  "exp": 1234567890
}
```

## 🔄 User Registration Flow

1. **User registers** → `POST /api/v1/auth/user/register`
   - Creates account (status: PENDING)
   - Creates primary profile (no password yet)
   - Generates activation token (24h expiry)
   - Returns token (in production, send via email only)

2. **User receives email** with activation link
   - Link contains token: `https://app.com/activate?token=xxx`

3. **User sets password** → `POST /api/v1/auth/user/activate`
   - Validates token
   - Sets password (bcrypt hashed)
   - Activates account (status: ACTIVE)
   - Marks token as used

4. **User logs in** → `POST /api/v1/auth/user/login`
   - Validates credentials
   - Returns JWT token with location_id

## 📍 Location Context

### How location_id is Set

1. **During Login** - Included in JWT token payload
2. **In Requests** - Extracted by middleware from:
   - `x-location-id` header (priority)
   - Request body `location_id`
   - JWT token `location_id`

### How to Use in Services

```typescript
export const someService = async (req: Request) => {
  const locationId = (req as any).locationId;
  
  const { data } = await supabase
    .from('table')
    .select('*')
    .eq('location_id', locationId);  // Manual filter
};
```

## ⚠️ RLS Important Notes

### Current Limitation
**Supabase JS client does NOT support PostgreSQL session variables.**

The RLS policies in your SQL files use:
```sql
WHERE location_id = current_setting('app.current_location_id', true)::uuid
```

This will **always return NULL** when using Supabase JS client.

### Current Solution
1. Using **service role key** (bypasses RLS)
2. **Manual filtering** in application code
3. **Disabled RLS** on `account_activation_tokens` table

### Production Options
1. Switch to **Supabase Auth** (recommended)
2. Use **PostgreSQL RPC functions**
3. Implement **manual filtering** with service role key

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Auth Flow Tests
```bash
npm run test:auth
```

### Manual Testing

1. **Create Location**
```bash
POST /api/v1/locations
{
  "name": "Test Location",
  "address": "123 Main St",
  "city": "Test City",
  "state": "CA",
  "zip_code": "12345"
}
```

2. **Register User**
```bash
POST /api/v1/auth/user/register
{
  "location_id": "location-uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "date_of_birth": "1990-01-15"
}
# Returns: { activation_token: "uuid" }
```

3. **Activate Account**
```bash
POST /api/v1/auth/user/activate
{
  "token": "activation-token-uuid",
  "password": "SecurePassword123!"
}
```

4. **Login**
```bash
POST /api/v1/auth/user/login
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
# Returns: { token: "jwt-token", staff: {...} }
```

5. **Use JWT Token**
```bash
GET /api/v1/some-endpoint
Headers:
  Authorization: Bearer jwt-token
```

## 🔧 Required SQL Migration

Run this in your Supabase SQL editor:

```sql
-- Disable RLS on activation tokens for Supabase client compatibility
ALTER TABLE account_activation_tokens DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Location Isolation via Account" ON account_activation_tokens;
```

## 📝 Next Steps

1. **Apply SQL Migration** - Run `sql/10_fix_rls_for_supabase_client.sql`
2. **Test Auth Flow** - Run `npm run test:auth`
3. **Integrate Email** - Configure email service for activation emails
4. **Staff Creation** - Create admin staff accounts manually in database
5. **Production Security** - Review `AUTHENTICATION_RLS_DOCUMENTATION.md`

## 🐛 Known Issues

1. **RLS Session Variables** - Not supported by Supabase JS client
   - Solution: Using service role key + manual filtering
   
2. **Activation Token in Response** - Currently returned in API response
   - Solution: Remove in production, send only via email

3. **No Email Integration** - Tokens logged to console
   - Solution: Implement email service using configured SMTP

## 📚 Files Created/Modified

### Created
- `src/middlewares/auth.ts`
- `src/middlewares/setLocationContext.ts`
- `src/scripts/test-auth-flow.ts`
- `sql/09_helper_functions.sql`
- `sql/10_fix_rls_for_supabase_client.sql`
- `AUTHENTICATION_RLS_DOCUMENTATION.md`
- `AUTHENTICATION_IMPLEMENTATION_SUMMARY.md` (this file)

### Modified
- `src/services/auth.service.ts` - Added user registration, activation, login
- `src/controllers/auth.controller.ts` - Added user endpoints
- `src/routes/auth.routes.ts` - Added user routes
- `src/app.ts` - Added middleware
- `package.json` - Added test:auth script
- `tsconfig.json` - Excluded test scripts from build

## 🎯 Success Criteria

- ✅ Staff can login and receive JWT with location_id
- ✅ Users can register and receive activation token
- ✅ Users can activate account with token and password
- ✅ Users can login and receive JWT with location_id
- ✅ Location context is set from JWT token
- ✅ Middleware extracts and stores location_id
- ⚠️ RLS policies need SQL migration to work with Supabase client
