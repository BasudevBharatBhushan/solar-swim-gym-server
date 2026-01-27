-- Force Supabase PostgREST to reload schema cache
-- Run this in Supabase SQL Editor

-- Method 1: Send NOTIFY signal to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: If above doesn't work, add a comment to force schema change detection
COMMENT ON TABLE service_plans IS 'Service plans pricing table - schema reloaded';

-- Method 3: Check current table structure to verify plan_name doesn't exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'service_plans'
ORDER BY ordinal_position;

-- Expected columns (should NOT include plan_name):
-- service_plan_id, service_id, subscription_type_id, age_group, funding_type, price, currency, is_active, created_at
