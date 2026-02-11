CREATE TABLE IF NOT EXISTS signed_waiver (
    signed_waiver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profile(profile_id),
    waiver_template_id UUID NOT NULL REFERENCES waiver_template(waiver_template_id),
    waiver_type TEXT NOT NULL,
    content TEXT NOT NULL,
    signature_url TEXT NOT NULL,
    signed_at TIMESTAMPTZ DEFAULT now(),
    location_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_signed_waiver_profile_id ON signed_waiver(profile_id);
CREATE INDEX IF NOT EXISTS idx_signed_waiver_location_id ON signed_waiver(location_id);
