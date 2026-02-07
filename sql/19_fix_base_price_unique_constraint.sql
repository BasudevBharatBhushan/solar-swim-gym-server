-- Fix Base Price Unique Constraint
-- Previous constraint 'unique_base_price_tier' was too restrictive (didn't include name/role)

-- 1. Drop the constraint (which drops the index)
ALTER TABLE base_price DROP CONSTRAINT IF EXISTS unique_base_price_tier;

-- 2. Drop the index just in case it wasn't a constraint (idempotency)
DROP INDEX IF EXISTS unique_base_price_tier;

-- 3. Add the correct unique index allowing same age/term for different plans
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_price_unique_tier 
ON base_price (location_id, name, role, age_group_id, subscription_term_id);
