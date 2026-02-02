-- Migration to fix RLS issues for Supabase JS client compatibility
-- The Supabase JS client doesn't support PostgreSQL session variables,
-- so we need to adjust RLS policies or disable them for certain tables

-- Option 1: Disable RLS on account_activation_tokens
-- This table is already protected through the account relationship
-- and tokens are meant to be publicly accessible (they're sent via email)
ALTER TABLE account_activation_tokens DISABLE ROW LEVEL SECURITY;

-- Drop the existing policy
DROP POLICY IF EXISTS "Location Isolation via Account" ON account_activation_tokens;

-- Note: If you want to keep RLS enabled, you would need to:
-- 1. Use a service role key (bypasses RLS)
-- 2. Or implement a custom RPC function that sets the session variable
-- 3. Or use Supabase Auth instead of custom authentication

-- For now, disabling RLS on activation tokens is safe because:
-- - Tokens are UUIDs (hard to guess)
-- - They expire after 24 hours
-- - They can only be used once
-- - The actual account/profile data is still protected by RLS
