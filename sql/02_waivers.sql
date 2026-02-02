-- Waiver / Funding Programs
-- Section 2: Waiver / Funding Programs

CREATE TABLE IF NOT EXISTS waiver_program (
    waiver_program_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES location(location_id),
    name TEXT NOT NULL,
    description TEXT,
    requires_case_manager BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- RLS
ALTER TABLE waiver_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Location Isolation" ON waiver_program
    USING (location_id = current_setting('app.current_location_id', true)::uuid);
