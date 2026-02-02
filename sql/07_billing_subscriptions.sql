-- Section 10 & 11: Billing and Subscriptions

-- INVOICE
CREATE TABLE IF NOT EXISTS invoice (
    invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(account_id),
    location_id UUID NOT NULL REFERENCES location(location_id),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status invoice_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON invoice
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- PAYMENT
CREATE TABLE IF NOT EXISTS payment (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoice(invoice_id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT, -- Card / Cash / ACH
    gateway_ref TEXT,
    status payment_status NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT,
    attempted_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON payment
    USING (
        invoice_id IN (
            SELECT invoice_id FROM invoice 
            WHERE location_id = current_setting('app.current_location_id', true)::uuid
        )
    );


-- SUBSCRIPTION
CREATE TABLE IF NOT EXISTS subscription (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(account_id),
    location_id UUID NOT NULL REFERENCES location(location_id),
    invoice_id UUID REFERENCES invoice(invoice_id), -- Can be null initially? Prompt says FK.
    
    subscription_type subscription_type NOT NULL DEFAULT 'BASE',
    reference_id UUID NOT NULL, -- Generic FK (basePriceId / membershipFeeId / servicePriceId)
    subscription_term_id UUID REFERENCES subscription_term(subscription_term_id),
    
    unit_price_snapshot DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    billing_period_start DATE,
    billing_period_end DATE,
    
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON subscription
    USING (location_id = current_setting('app.current_location_id', true)::uuid);


-- SUBSCRIPTION COVERAGE
CREATE TABLE IF NOT EXISTS subscription_coverage (
    subscription_coverage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscription(subscription_id),
    profile_id UUID NOT NULL REFERENCES profile(profile_id),
    role pricing_role, -- PRIMARY / ADD_ON
    exempt BOOLEAN DEFAULT FALSE,
    exempt_reason TEXT
);

ALTER TABLE subscription_coverage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON subscription_coverage
    USING (
        subscription_id IN (
            SELECT subscription_id FROM subscription 
            WHERE location_id = current_setting('app.current_location_id', true)::uuid
        )
    );
