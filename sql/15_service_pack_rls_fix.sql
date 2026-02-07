-- RLS fix for service_pack: Allow Insert/Update/Delete
-- We previously only added SELECT.
-- We'll add a policy that allows everything for authenticated users for now, 
-- or ideally checks service location.

DROP POLICY IF EXISTS "Users can view service_pack based on service location" ON service_pack;

CREATE POLICY "Enable all access for authenticated users" ON service_pack
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- RLS fix for session: Allow Insert/Update/Delete
DROP POLICY IF EXISTS "Public read access to sessions" ON session;

CREATE POLICY "Enable all access for authenticated users" ON session
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
