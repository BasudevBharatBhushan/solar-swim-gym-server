-- Migration: Create waiver_template table
-- Description: Table to store waiver document templates with foreign keys to related entities

CREATE TABLE IF NOT EXISTS waiver_template (
    waiver_template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id) ON DELETE CASCADE,
    ageprofile_id UUID REFERENCES age_group(age_group_id) ON DELETE SET NULL,
    subterm_id UUID REFERENCES subscription_term(subscription_term_id) ON DELETE SET NULL,
    base_price_id UUID REFERENCES base_price(base_price_id) ON DELETE SET NULL,
    membership_category_id UUID REFERENCES membership_program_category(category_id) ON DELETE SET NULL,
    service_id UUID REFERENCES service(service_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE waiver_template ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view waiver templates for their location"
ON waiver_template FOR SELECT
TO authenticated
USING (
    location_id = (SELECT (current_setting('app.current_location_id'))::UUID)
    OR (SELECT role FROM staff WHERE staff_id = (SELECT (current_setting('app.current_staff_id'))::UUID)) = 'SUPERADMIN'
);

CREATE POLICY "Staff can insert/update waiver templates for their location"
ON waiver_template FOR ALL
TO authenticated
USING (
    location_id = (SELECT (current_setting('app.current_location_id'))::UUID)
    OR (SELECT role FROM staff WHERE staff_id = (SELECT (current_setting('app.current_staff_id'))::UUID)) = 'SUPERADMIN'
)
WITH CHECK (
    location_id = (SELECT (current_setting('app.current_location_id'))::UUID)
    OR (SELECT role FROM staff WHERE staff_id = (SELECT (current_setting('app.current_staff_id'))::UUID)) = 'SUPERADMIN'
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waiver_template_updated_at
BEFORE UPDATE ON waiver_template
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
