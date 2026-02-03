-- Create DiscountCode table
CREATE TABLE IF NOT EXISTS discount_codes (
    discount_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(staff_id) ON DELETE SET NULL,
    location_id UUID REFERENCES location(location_id) ON DELETE CASCADE,
    discount_code TEXT NOT NULL UNIQUE,
    discount TEXT NOT NULL, -- accepts "6%" or "6"
    staff_name TEXT, -- Denormalized as requested
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_location_id ON discount_codes(location_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(discount_code);

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Basic policies following the pattern (though service role bypasses this)
-- This might not be fully functional with the current JS client setup but follows project pattern
CREATE POLICY "Location Isolation for Discount Codes" ON discount_codes
    FOR ALL
    USING (location_id = current_setting('app.current_location_id', true)::uuid);

-- Since we use service role key in dev, let's also add simple authenticated select if needed
-- or just leave it for the application to handle via manual filtering as per documentation.
