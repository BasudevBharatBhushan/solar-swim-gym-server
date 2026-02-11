-- Migration to add recurrence_unit_value to subscription_term
-- Also ensuring recurrence_unit exists as documented in DATABASE_ARCHITECTURE.md

ALTER TABLE subscription_term 
ADD COLUMN IF NOT EXISTS recurrence_unit TEXT DEFAULT 'MONTH',
ADD COLUMN IF NOT EXISTS recurrence_unit_value INT DEFAULT 1;
