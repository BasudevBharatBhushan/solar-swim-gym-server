CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    account_id UUID NOT NULL
        REFERENCES accounts(account_id),

    billing_period_start DATE,
    billing_period_end DATE,

    amount_due NUMERIC(10,2) NOT NULL,
    amount_paid NUMERIC(10,2) DEFAULT 0,

    due_date DATE,

    status TEXT NOT NULL
        CHECK (status IN (
            'draft',
            'open',
            'paid',
            'void',
            'uncollectible'
        )),

    invoice_number TEXT UNIQUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payment_attempts (
    payment_attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    invoice_id UUID NOT NULL
        REFERENCES invoices(invoice_id)
        ON DELETE CASCADE,

    provider TEXT,
    provider_payment_id TEXT,

    amount_attempted NUMERIC(10,2),

    status TEXT,
    failure_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    invoice_id UUID NOT NULL
        REFERENCES invoices(invoice_id),

    account_id UUID NOT NULL
        REFERENCES accounts(account_id),

    payment_attempt_id UUID
        REFERENCES payment_attempts(payment_attempt_id),

    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    reference_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from subscriptions to invoices
ALTER TABLE subscriptions
    ADD CONSTRAINT fk_subscriptions_invoices
    FOREIGN KEY (invoice_id)
    REFERENCES invoices(invoice_id)
    ON DELETE SET NULL;
