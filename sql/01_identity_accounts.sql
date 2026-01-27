CREATE TABLE accounts (
    account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT, -- Nullable initially, set during activation
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    account_id UUID NOT NULL
        REFERENCES accounts(account_id)
        ON DELETE CASCADE,

    parent_profile_id UUID
        REFERENCES profiles(profile_id)
        ON DELETE SET NULL,

    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,

    email TEXT, -- Contact email, separate from login
    -- password_hash removed, login is at account level

    role TEXT NOT NULL CHECK (role IN ('PARENT', 'CHILD')),

    rceb_flag BOOLEAN DEFAULT FALSE,

    case_manager_name TEXT,
    case_manager_email TEXT,

    guardian_name TEXT,
    guardian_phoneNo TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff (
    staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
