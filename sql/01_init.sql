-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid() if needed and hashing (though app does hashing usually)

-- ENUMS --

-- Account Status
CREATE TYPE account_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- Payment Mode
CREATE TYPE payment_mode AS ENUM ('PIF', 'RECURRING');

-- Role
CREATE TYPE pricing_role AS ENUM ('PRIMARY', 'ADD_ON');

-- Eligibility Result
CREATE TYPE eligibility_result AS ENUM ('ALLOW', 'DENY');

-- Fee Type
CREATE TYPE fee_type AS ENUM ('JOINING', 'ANNUAL');

-- Billing Cycle
CREATE TYPE fee_billing_cycle AS ENUM ('ONE_TIME', 'YEARLY');

-- Subscription Type
CREATE TYPE subscription_type AS ENUM ('BASE', 'MEMBERSHIP_FEE', 'ADDON_SERVICE');

-- Subscription Status
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'PAID', 'CANCELLED');

-- Invoice Status
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'PAID', 'PARTIAL', 'FAILED');

-- Payment Status
CREATE TYPE payment_status AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- Location Table (Assumed for RLS FKs)
CREATE TABLE IF NOT EXISTS location (
    location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on Location (Optional, but good practice if locations are also scoped)
ALTER TABLE location ENABLE ROW LEVEL SECURITY;

-- Generic RLS Policy Function (Optional, can just use inline SQL)
-- Assumes app.current_location_id is set in the session
