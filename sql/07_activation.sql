CREATE TABLE profile_activation_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL
        REFERENCES accounts(account_id)
        ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
