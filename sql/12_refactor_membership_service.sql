-- Migration: Refactor MembershipService table
-- Purpose: Remove category-level service linking and allow services at Base Plan level (NULL program ID).

-- 1. Remove category_id column
-- Services apply to the membership program as a whole, not individual categories.
ALTER TABLE membership_service 
DROP COLUMN IF EXISTS category_id;

-- 2. Allow membership_program_id to be NULL
-- A NULL value indicates the service belongs to a BASE PLAN (non-membership).
ALTER TABLE membership_service 
ALTER COLUMN membership_program_id DROP NOT NULL;

-- Add comment for clarification
COMMENT ON TABLE membership_service IS 'Services bundled into a membership or base plan. If membership_program_id is NULL, it is a Base Plan service.';
