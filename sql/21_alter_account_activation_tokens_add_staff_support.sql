-- Migration to alter account_activation_tokens to support staff password resets
-- Description: Add staff_id and is_staff fields, and make account_id nullable.

ALTER TABLE account_activation_tokens 
ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE account_activation_tokens 
ADD COLUMN staff_id UUID REFERENCES staff(staff_id) ON DELETE CASCADE,
ADD COLUMN is_staff BOOLEAN DEFAULT FALSE;

-- Add constraint to ensure either account_id or staff_id is present
ALTER TABLE account_activation_tokens
ADD CONSTRAINT account_or_staff_required
CHECK (
  (account_id IS NOT NULL AND staff_id IS NULL AND is_staff = FALSE) OR
  (account_id IS NULL AND staff_id IS NOT NULL AND is_staff = TRUE)
);
