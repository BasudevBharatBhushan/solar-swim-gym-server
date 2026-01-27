## 🔍 E2E Test Failure - Diagnosis Report

### Issue
The E2E test fails when creating a service plan via the API with error:
```
Could not find the 'plan_name' column of 'service_plans' in the schema cache
```

### Investigation Results

#### ✅ What's Working
1. **Database Schema** - Correct (no `plan_name` column in `sql/03_pricing.sql`)
2. **TypeScript Types** - Fixed (removed `plan_name` from `ServicePlan` interface)
3. **Test Payload** - Correct (test-e2e.ts sends proper fields without `plan_name`)
4. **Direct Supabase Inserts** - Working (bypasses PostgREST)

#### ❌ What's Failing
- **API Endpoint** - `POST /admin/service-plans` returns 500 error
- Error occurs at Supabase PostgREST layer, not in our code

### Root Cause
**Supabase PostgREST schema cache** still contains the old schema with `plan_name` column, even though:
- The actual database table doesn't have it
- Postgres was restarted
- Our code doesn't reference it

### Solution Required

Since you're using **Supabase Cloud** (https://gwjzjllmyfrkzmijtxjs.supabase.co), you need to reload the PostgREST schema cache:

#### Option 1: Via Supabase Dashboard (Recommended)
1. Go to: https://app.supabase.com/project/gwjzjllmyfrkzmijtxjs
2. Navigate to **Settings** → **API**
3. Click **"Reload schema"** or **"Restart API"** button

#### Option 2: Via SQL (Force Schema Reload)
Run this in Supabase SQL Editor:
```sql
-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
```

#### Option 3: Check if table needs to be recreated
If the above doesn't work, the `service_plans` table might need to be dropped and recreated:
```sql
-- Check current table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'service_plans' 
ORDER BY ordinal_position;
```

If you see `plan_name` in the results, the table structure is wrong and needs to be fixed.

### Next Steps
1. Try reloading PostgREST schema cache via Supabase dashboard
2. If that doesn't work, check actual table structure in database
3. May need to drop and recreate `service_plans` table using `sql/03_pricing.sql`
