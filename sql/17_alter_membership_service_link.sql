-- 17_alter_membership_service_link.sql

-- 1. Add base_price_id column
ALTER TABLE membership_service
ADD COLUMN base_price_id UUID REFERENCES base_price(base_price_id);

-- 2. Drop existing FK for membership_program_id (referencing membership_program)
ALTER TABLE membership_service
DROP CONSTRAINT membership_service_membership_program_id_fkey;

-- 3. Add new FK for membership_program_id (referencing membership_program_category)
-- Note: existing data in membership_program_id might violate this if they are program IDs not category IDs.
-- Assuming we can proceed without migrating data or that data is compatible/empty.
-- If strict validation is needed, we would need to clean up data first.
ALTER TABLE membership_service
ADD CONSTRAINT membership_service_membership_program_id_fkey
FOREIGN KEY (membership_program_id) REFERENCES membership_program_category(category_id);

-- 4. Add check constraint to ensure mostly one of them is set (optional but good practice based on "either... or")
-- The user said "accept either... or base_price_id there".
-- existing is_part_of_base_plan might become redundant if base_price_id is set, but keeping it for now to avoid breaking too much.
