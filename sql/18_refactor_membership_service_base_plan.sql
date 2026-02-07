-- Refactor membership_service for Base Plan Uniqueness
-- Removes base_price_id and replaces it with components: location_id, role, age_group_id

-- 1. Remove base_price_id column (and its data/constraint)
ALTER TABLE membership_service
DROP COLUMN IF EXISTS base_price_id;

-- 2. Add new columns for Base Plan definition
ALTER TABLE membership_service
ADD COLUMN location_id UUID REFERENCES location(location_id),
ADD COLUMN baseprice_role TEXT, -- 'PRIMARY' or 'ADD_ON'
ADD COLUMN baseprice_age_group_id UUID REFERENCES age_group(age_group_id);

-- 3. Add constraint to ensure uniqueness for Base Plan services
-- A service can only appear once for a given (location, role, age_group) combination
CREATE UNIQUE INDEX idx_unique_base_plan_service 
ON membership_service (location_id, baseprice_role, baseprice_age_group_id, service_id) 
WHERE membership_program_id IS NULL;

-- 4. Add check constraint for role enum consistency (optional but good practice)
ALTER TABLE membership_service
ADD CONSTRAINT chk_baseprice_role CHECK (baseprice_role IN ('PRIMARY', 'ADD_ON'));
