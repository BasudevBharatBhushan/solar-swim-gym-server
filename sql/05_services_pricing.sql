-- Section 4 & 5: Services and Pricing

-- SERVICE
CREATE TABLE IF NOT EXISTS service (
    service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    name TEXT NOT NULL,
    description TEXT,
    is_addon_only BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Types
    type TEXT, -- Private/Group
    service_type TEXT -- SELF/TRAINING/WORKSHOP
);

ALTER TABLE service ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON service
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- SERVICE PRICE (Add-ons)
CREATE TABLE IF NOT EXISTS service_price (
    service_price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES service(service_id),
    location_id UUID NOT NULL REFERENCES location(location_id),
    age_group_id UUID NOT NULL REFERENCES age_group(age_group_id),
    subscription_term_id UUID NOT NULL REFERENCES subscription_term(subscription_term_id),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE service_price ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON service_price
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- BASE PRICE (Core)
CREATE TABLE IF NOT EXISTS base_price (
    base_price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    name TEXT NOT NULL,
    role pricing_role NOT NULL DEFAULT 'PRIMARY',
    age_group_id UUID NOT NULL REFERENCES age_group(age_group_id),
    subscription_term_id UUID NOT NULL REFERENCES subscription_term(subscription_term_id),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE base_price ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON base_price
    USING (location_id = current_setting('app.current_location_id', true)::uuid);
