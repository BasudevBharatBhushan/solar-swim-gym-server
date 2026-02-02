-- Section 8: Staff & Leads

-- STAFF ROLE ENUM
CREATE TYPE staff_role AS ENUM ('SUPERADMIN', 'ADMIN', 'STAFF');

-- STAFF
CREATE TABLE IF NOT EXISTS staff (
    staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES location(location_id), -- Nullable for Superadmin
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role staff_role NOT NULL DEFAULT 'STAFF',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS for Staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Superadmin sees all, others see only their location
CREATE POLICY "Staff Visibility" ON staff
    USING (
        (SELECT role FROM staff WHERE staff_id = current_setting('app.current_user_id', true)::uuid) = 'SUPERADMIN'
        OR
        location_id = current_setting('app.current_location_id', true)::uuid
    );


-- LEAD STATUS ENUM
CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'ARCHIVED');

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
    lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    mobile TEXT,
    status lead_status NOT NULL DEFAULT 'NEW',
    
    added_by_staff_id UUID REFERENCES staff(staff_id),
    added_by_staff_name TEXT, -- Snapshot
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS for Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON leads
    USING (location_id = current_setting('app.current_location_id', true)::uuid);
