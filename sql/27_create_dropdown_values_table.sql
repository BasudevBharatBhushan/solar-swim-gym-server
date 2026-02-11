-- Create dropdown_values table
CREATE TABLE IF NOT EXISTS dropdown_values (
    dropdown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES location(location_id) NOT NULL,
    module TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE dropdown_values ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies
-- Policy for selection: filter by location_id
CREATE POLICY "Enable read for location" ON dropdown_values
    FOR SELECT USING (location_id = (current_setting('app.current_location_id', true))::uuid);

-- Policy for insert: check location_id
CREATE POLICY "Enable insert for location" ON dropdown_values
    FOR INSERT WITH CHECK (location_id = (current_setting('app.current_location_id', true))::uuid);

-- Policy for update: check location_id
CREATE POLICY "Enable update for location" ON dropdown_values
    FOR UPDATE USING (location_id = (current_setting('app.current_location_id', true))::uuid);

-- Policy for delete: check location_id
CREATE POLICY "Enable delete for location" ON dropdown_values
    FOR DELETE USING (location_id = (current_setting('app.current_location_id', true))::uuid);
