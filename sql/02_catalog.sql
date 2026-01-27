CREATE TABLE services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    eligibility_rules JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memberships (
    membership_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE membership_services (
    membership_id UUID NOT NULL
        REFERENCES memberships(membership_id)
        ON DELETE CASCADE,

    service_id UUID NOT NULL
        REFERENCES services(service_id)
        ON DELETE CASCADE,

    access_type TEXT NOT NULL
        CHECK (access_type IN ('CORE', 'ADDON')),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (membership_id, service_id)
);
