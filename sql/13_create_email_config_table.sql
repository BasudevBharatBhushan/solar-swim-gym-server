-- Create email_smtp_config table
CREATE TABLE IF NOT EXISTS public.email_smtp_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.location(location_id),
    smtp_host TEXT,
    smtp_port INTEGER,
    sender_email TEXT,
    sender_name TEXT,
    smtp_username TEXT,
    smtp_password TEXT,
    is_secure BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_location_email_config UNIQUE (location_id)
);

-- Enable Row Level Security
ALTER TABLE public.email_smtp_config ENABLE ROW LEVEL SECURITY;

-- Create Policy for RLS
CREATE POLICY "Users can view email config for their location" ON public.email_smtp_config
    FOR SELECT
    USING (location_id = (current_setting('app.current_location_id'::text, true))::uuid);

CREATE POLICY "Users can insert email config for their location" ON public.email_smtp_config
    FOR INSERT
    WITH CHECK (location_id = (current_setting('app.current_location_id'::text, true))::uuid);

CREATE POLICY "Users can update email config for their location" ON public.email_smtp_config
    FOR UPDATE
    USING (location_id = (current_setting('app.current_location_id'::text, true))::uuid);

CREATE POLICY "Users can delete email config for their location" ON public.email_smtp_config
    FOR DELETE
    USING (location_id = (current_setting('app.current_location_id'::text, true))::uuid);

-- Add Public Access policy to match existing project pattern for JS client compatibility
CREATE POLICY "Public Access Email Config" ON public.email_smtp_config
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create Policy for Service Role (if needed for background jobs or superadmins bypassing RLS via service key)
-- Usually service role bypasses RLS, but explicit policies for superadmin users might be needed if they masquerade.
-- Assuming standard setup where superadmins might need access to all.

-- Grant permissions
GRANT ALL ON public.email_smtp_config TO authenticated;
GRANT ALL ON public.email_smtp_config TO service_role;
