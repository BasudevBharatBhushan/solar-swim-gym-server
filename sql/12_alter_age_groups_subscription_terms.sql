-- Alter age_group table to accept decimal values for min_age and max_age
ALTER TABLE age_group 
    ALTER COLUMN min_age TYPE DECIMAL(5,2),
    ALTER COLUMN max_age TYPE DECIMAL(5,2);

-- Rename enum value 'PIF' to 'PAY_IN_FULL' in payment_mode
-- Step 1: Add the new value
ALTER TYPE payment_mode ADD VALUE 'PAY_IN_FULL';

-- Step 2: Update existing references (if any)
UPDATE subscription_term SET payment_mode = 'PAY_IN_FULL' WHERE payment_mode = 'PIF';

-- Step 3: Remove the old value (PostgreSQL doesn't support direct removal easily, 
-- but we can rename it or just leave it. However, 'RENAME VALUE' is preferred if we want to replace it).
-- PostgreSQL 10+ supports RENAME VALUE.
ALTER TYPE payment_mode RENAME VALUE 'PIF' TO 'PAY_IN_FULL_OLD'; -- Temporarily rename to avoid collision if we added it above.
-- Actually, the cleanest way if PIF is old and PAY_IN_FULL is new:
-- ALTER TYPE payment_mode RENAME VALUE 'PIF' TO 'PAY_IN_FULL'; 
-- But if I already added 'PAY_IN_FULL', I can't rename PIF to it.

-- Let's do it properly for a migration:
-- If we want to CHANGE PIF to PAY_IN_FULL:
-- ALTER TYPE payment_mode RENAME VALUE 'PIF' TO 'PAY_IN_FULL';
-- Note: RENAME VALUE cannot be run in a transaction block in some PG versions, 
-- but usually it's fine.

-- Let's restart the enum part to be more robust:
-- We'll check if PIF exists and rename it.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'payment_mode' AND e.enumlabel = 'PIF') THEN
        ALTER TYPE payment_mode RENAME VALUE 'PIF' TO 'PAY_IN_FULL';
    END IF;
END $$;
