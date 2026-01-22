-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Accounts Table (Family/Payer)
CREATE TABLE public.accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table (Participants/Users)
CREATE TABLE public.profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(account_id),
    parent_profile_id UUID REFERENCES public.profiles(profile_id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    email TEXT UNIQUE, -- Nullable
    password_hash TEXT, -- Nullable for children without login
    role TEXT NOT NULL CHECK (role IN ('PARENT', 'CHILD')),
    rceb_flag BOOLEAN DEFAULT FALSE,
    case_manager_name TEXT,
    case_manager_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Parent profile must not have a parent_profile_id
    CONSTRAINT check_parent_role CHECK (
        (role = 'PARENT' AND parent_profile_id IS NULL) OR
        (role = 'CHILD' AND parent_profile_id IS NOT NULL)
    )
);

-- 3. Services Table (Master Config)
CREATE TABLE public.services (
    service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    eligibility_rules JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Profile_Services Table (Enrollment)
CREATE TABLE public.profile_services (
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id),
    service_id UUID NOT NULL REFERENCES public.services(service_id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (profile_id, service_id)
);

-- 5. Activation Tokens Table (For secure login setup)
CREATE TABLE public.profile_activation_tokens (
    token TEXT PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Subscription & Billing Layer

-- 6.1 Subscription Types (Behavior Definition)
CREATE TABLE public.subscription_types (
    subscription_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name TEXT NOT NULL UNIQUE, -- e.g. 'Monthly', 'Quarterly'
    billing_interval_unit TEXT NOT NULL CHECK (billing_interval_unit IN ('day', 'month', 'year')),
    billing_interval_count INTEGER NOT NULL DEFAULT 1,
    auto_renew BOOLEAN DEFAULT TRUE,
    allows_pause BOOLEAN DEFAULT TRUE,
    allows_cancel BOOLEAN DEFAULT TRUE,
    generates_invoices BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.2 Service Plans (Price + Behavior)
CREATE TABLE public.service_plans (
    service_plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES public.services(service_id),
    subscription_type_id UUID NOT NULL REFERENCES public.subscription_types(subscription_type_id),
    plan_name TEXT NOT NULL, -- e.g. 'Swim 101 Monthly'
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    age_group TEXT, -- New Column
    funding_type TEXT, -- New Column
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unique Index for Upsert Logic
CREATE UNIQUE INDEX idx_service_plans_upsert ON public.service_plans (service_id, subscription_type_id, funding_type, age_group);

-- 6.3 Subscriptions (Contract State)
CREATE TABLE public.subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.accounts(account_id),
    profile_id UUID NOT NULL REFERENCES public.profiles(profile_id), -- Beneficiary
    service_plan_id UUID NOT NULL REFERENCES public.service_plans(service_plan_id),
    status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'paused', 'canceled', 'expired', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.4 Invoices (Payable Obligation)
CREATE TABLE public.invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(subscription_id),
    account_id UUID NOT NULL REFERENCES public.accounts(account_id),
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) DEFAULT 0.00,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    invoice_number TEXT UNIQUE, -- Human readable ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.5 Payment Attempts (Gateway Interactions)
CREATE TABLE public.payment_attempts (
    payment_attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(invoice_id),
    provider TEXT NOT NULL, -- e.g. 'stripe', 'paypal'
    provider_payment_id TEXT, -- External ID
    amount_attempted NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'pending', 'succeeded', 'failed')),
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.6 Payments (Confirmed Money / Ledger)
CREATE TABLE public.payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(invoice_id),
    account_id UUID NOT NULL REFERENCES public.accounts(account_id),
    payment_attempt_id UUID REFERENCES public.payment_attempts(payment_attempt_id),
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT, -- e.g. 'card_1234'
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reference_id TEXT UNIQUE -- Transaction ID for accounting
);

-- Indexes for Performance
CREATE INDEX idx_profiles_account ON public.profiles(account_id);
CREATE INDEX idx_profiles_parent ON public.profiles(parent_profile_id);
CREATE INDEX idx_profile_services_profile ON public.profile_services(profile_id);

-- New Indexes
CREATE INDEX idx_service_plans_service ON public.service_plans(service_id);
CREATE INDEX idx_subscriptions_account ON public.subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);

-- Dummy Services for testing
INSERT INTO public.services (service_name, service_type, eligibility_rules) VALUES 
('Swim 101', 'CLASS', '{"min_age": 4}'),
('Aquatic Therapy', 'THERAPY', '{"rceb_required": true}'),
('Family Swim', 'RECREATION', '{}');

-- 7. Stored Procedure for Atomic Onboarding
CREATE OR REPLACE FUNCTION complete_onboarding(
    payload JSONB
) RETURNS JSONB AS $$
DECLARE
    new_account_id UUID;
    parent_id UUID;
    child_record JSONB;
    child_id UUID;
    service_id_text TEXT;
    new_token TEXT;
    activation_data JSONB := '[]'::jsonb;
BEGIN
    -- 1. Create Account
    INSERT INTO public.accounts (status)
    VALUES ('active')
    RETURNING account_id INTO new_account_id;

    -- 2. Create Parent Profile
    INSERT INTO public.profiles (
        account_id, first_name, last_name, email, password_hash, 
        role, rceb_flag, case_manager_name, case_manager_email, date_of_birth
    )
    VALUES (
        new_account_id,
        payload->'primary_profile'->>'first_name',
        payload->'primary_profile'->>'last_name',
        payload->'primary_profile'->>'email',
        payload->'primary_profile'->>'password',
        'PARENT',
        (payload->'primary_profile'->>'rceb_flag')::boolean,
        payload->'primary_profile'->'case_manager'->>'name',
        payload->'primary_profile'->'case_manager'->>'email',
        (payload->'primary_profile'->>'date_of_birth')::date
    )
    RETURNING profile_id INTO parent_id;

    -- 3. Create Child Profiles & Services
    FOR child_record IN SELECT * FROM jsonb_array_elements(payload->'family_members')
    LOOP
        -- Insert Child
        INSERT INTO public.profiles (
            account_id, parent_profile_id, first_name, last_name, 
            date_of_birth, email, role, rceb_flag
        )
        VALUES (
            new_account_id,
            parent_id,
            child_record->>'first_name',
            child_record->>'last_name',
            (child_record->>'date_of_birth')::date,
            child_record->>'email',
            'CHILD',
            (child_record->>'rceb_flag')::boolean
        )
        RETURNING profile_id INTO child_id;

        -- Insert Services for Child
        IF child_record ? 'services' THEN
            FOR service_id_text IN SELECT * FROM jsonb_array_elements_text(child_record->'services')
            LOOP
                INSERT INTO public.profile_services (profile_id, service_id)
                VALUES (child_id, service_id_text::uuid);
            END LOOP;
        END IF;

        -- Generate Activation Token if email exists
        IF child_record->>'email' IS NOT NULL AND child_record->>'email' != '' THEN
            new_token := encode(gen_random_bytes(32), 'hex');
            INSERT INTO public.profile_activation_tokens (token, profile_id, expires_at)
            VALUES (new_token, child_id, NOW() + INTERVAL '7 days');
            
            activation_data := activation_data || jsonb_build_object(
                'email', child_record->>'email',
                'token', new_token,
                'first_name', child_record->>'first_name'
            );
        END IF;
        
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'account_id', new_account_id,
        'parent_profile_id', parent_id,
        'activations', activation_data
    );

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql;

