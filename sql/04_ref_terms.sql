-- Section 3: Age & Subscription Terms

-- AGE GROUP (Global Reference)
CREATE TABLE IF NOT EXISTS age_group (
    age_group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_age INT NOT NULL,
    max_age INT NOT NULL
);
-- No RLS needed if global, or readable by all. 
-- If sensitive, could enable RLS providing true for all authenticated users.


-- SUBSCRIPTION TERM
CREATE TABLE IF NOT EXISTS subscription_term (
    subscription_term_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    name TEXT NOT NULL,
    duration_months INT NOT NULL DEFAULT 1,
    payment_mode payment_mode NOT NULL DEFAULT 'RECURRING',
    is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE subscription_term ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Location Isolation" ON subscription_term
    USING (location_id = current_setting('app.current_location_id', true)::uuid);
