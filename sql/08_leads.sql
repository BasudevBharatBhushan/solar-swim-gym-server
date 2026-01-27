-- Leads Table
-- Independent table for managing leads with no relations to other tables

CREATE TABLE leads (
    lead_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Lead Details
    source TEXT, -- e.g., 'website', 'referral', 'social_media', 'walk-in'
    status TEXT NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    
    -- Additional Information
    notes TEXT,
    company TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Metadata
    lead_added_on TIMESTAMPTZ DEFAULT NOW(),
    last_contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_lead_added_on ON leads(lead_added_on DESC);
CREATE INDEX idx_leads_first_name ON leads(first_name);
CREATE INDEX idx_leads_last_name ON leads(last_name);

-- Create full-text search index
CREATE INDEX idx_leads_search ON leads USING gin(
    to_tsvector('english', 
        coalesce(first_name, '') || ' ' || 
        coalesce(last_name, '') || ' ' || 
        coalesce(email, '') || ' ' || 
        coalesce(phone, '') || ' ' || 
        coalesce(company, '') || ' ' || 
        coalesce(notes, '')
    )
);
