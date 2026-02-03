-- Migration: Refactor MembershipService table
-- 1. Remove category_id column
-- 2. Allow membership_program_id to be NULL (for Base Plan services)
-- Run this in your Supabase SQL Editor

ALTER TABLE membership_service 
DROP COLUMN IF EXISTS category_id;

ALTER TABLE membership_service 
ALTER COLUMN membership_program_id DROP NOT NULL;

COMMENT ON TABLE membership_service IS 'Services bundled into a membership or base plan. If membership_program_id is NULL, it is a Base Plan service.';
