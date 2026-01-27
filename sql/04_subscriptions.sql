CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    account_id UUID NOT NULL
        REFERENCES accounts(account_id),

    profile_id UUID NOT NULL
        REFERENCES profiles(profile_id),

    subscription_kind TEXT NOT NULL
        CHECK (subscription_kind IN ('MEMBERSHIP', 'ADDON')),

    membership_plan_id UUID
        REFERENCES membership_plans(membership_plan_id),

    service_plan_id UUID
        REFERENCES service_plans(service_plan_id),

    status TEXT NOT NULL
        CHECK (
            status IN (
                'trialing',
                'active',
                'paused',
                'canceled',
                'expired',
                'past_due'
            )
        ),

    current_period_start DATE,
    current_period_end DATE,

    invoice_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
