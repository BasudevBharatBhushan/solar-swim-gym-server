CREATE TABLE subscription_types (
    subscription_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name TEXT NOT NULL,
    billing_interval_unit TEXT NOT NULL
        CHECK (billing_interval_unit IN ('day', 'month', 'year')),
    billing_interval_count INTEGER NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE membership_plans (
    membership_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    membership_id UUID NOT NULL
        REFERENCES memberships(membership_id),

    subscription_type_id UUID NOT NULL
        REFERENCES subscription_types(subscription_type_id),

    age_group TEXT NOT NULL
        CHECK (age_group IN ('child', 'adult', 'senior')),

    funding_type TEXT NOT NULL
        CHECK (funding_type IN ('private', 'rceb')),

    price NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_plans (
    service_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    service_id UUID NOT NULL
        REFERENCES services(service_id),

    subscription_type_id UUID NOT NULL
        REFERENCES subscription_types(subscription_type_id),

    age_group TEXT NOT NULL
        CHECK (age_group IN ('child', 'adult', 'senior')),

    funding_type TEXT NOT NULL
        CHECK (funding_type IN ('private', 'rceb')),

    price NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
