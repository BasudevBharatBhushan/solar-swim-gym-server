-- Section 1: Account & Identity

-- ACCOUNT
CREATE TABLE IF NOT EXISTS account (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    status account_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE account ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON account
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- PROFILE
CREATE TABLE IF NOT EXISTS profile (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(account_id),
    location_id UUID NOT NULL REFERENCES location(location_id),
    
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    
    email TEXT, -- Required for primary
    password TEXT, -- Hashed
    
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Minor / Emergency
    guardian_name TEXT,
    guardian_mobile TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    -- Waiver / Funding
    waiver_program_id UUID REFERENCES waiver_program(waiver_program_id),
    case_manager_name TEXT,
    case_manager_email TEXT
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON profile
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- ACCOUNT ACTIVATION TOKENS
CREATE TABLE IF NOT EXISTS account_activation_tokens (
    token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(account_id),
    token UUID NOT NULL DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS for Tokens (via Account -> Location)
ALTER TABLE account_activation_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation via Account" ON account_activation_tokens
    USING (
        account_id IN (
            SELECT account_id FROM account 
            WHERE location_id = current_setting('app.current_location_id', true)::uuid
        )
    );
