CREATE TABLE contracts (
    contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    account_id UUID NOT NULL
        REFERENCES accounts(account_id),

    contract_pdf TEXT,
    is_signed BOOLEAN DEFAULT FALSE,

    start_date DATE,
    expiry_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
