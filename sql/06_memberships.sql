-- Section 6, 7, 8, 9: Membership Structure

-- MEMBERSHIP PROGRAM (Club Level)
CREATE TABLE IF NOT EXISTS membership_program (
    membership_program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE membership_program ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON membership_program
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- MEMBERSHIP PROGRAM CATEGORY (e.g. Single, Family)
CREATE TABLE IF NOT EXISTS membership_program_category (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_program_id UUID NOT NULL REFERENCES membership_program(membership_program_id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS via Join
ALTER TABLE membership_program_category ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON membership_program_category
    USING (
        membership_program_id IN (
            SELECT membership_program_id FROM membership_program
            WHERE location_id = current_setting('app.current_location_id', true)::uuid
        )
    );


-- MEMBERSHIP ELIGIBILITY RULE
CREATE TABLE IF NOT EXISTS membership_eligibility_rule (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES membership_program_category(category_id),
    priority INT NOT NULL,
    result eligibility_result NOT NULL,
    condition_json JSONB NOT NULL,
    message TEXT
);

-- RLS via Nested Join
ALTER TABLE membership_eligibility_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON membership_eligibility_rule
    USING (
        category_id IN (
            SELECT category_id FROM membership_program_category
            WHERE membership_program_id IN (
                SELECT membership_program_id FROM membership_program
                WHERE location_id = current_setting('app.current_location_id', true)::uuid
            )
        )
    );


-- MEMBERSHIP FEE
CREATE TABLE IF NOT EXISTS membership_fee (
    membership_fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES membership_program_category(category_id),
    fee_type fee_type NOT NULL,
    billing_cycle fee_billing_cycle NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

-- RLS via Nested Join
ALTER TABLE membership_fee ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON membership_fee
    USING (
        category_id IN (
            SELECT category_id FROM membership_program_category
            WHERE membership_program_id IN (
                SELECT membership_program_id FROM membership_program
                WHERE location_id = current_setting('app.current_location_id', true)::uuid
            )
        )
    );


-- MEMBERSHIP SERVICE (Bundles)
CREATE TABLE IF NOT EXISTS membership_service (
    membership_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_program_id UUID NOT NULL REFERENCES membership_program(membership_program_id),
    category_id UUID REFERENCES membership_program_category(category_id), -- Nullable if base plan
    service_id UUID NOT NULL REFERENCES service(service_id),
    
    is_included BOOLEAN DEFAULT TRUE,
    usage_limit INT,
    is_part_of_base_plan BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    discount DECIMAL(10, 2) -- Amount or Percentage
);

-- RLS via Program (simpler)
ALTER TABLE membership_service ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON membership_service
    USING (
        membership_program_id IN (
            SELECT membership_program_id FROM membership_program
            WHERE location_id = current_setting('app.current_location_id', true)::uuid
        )
    );
