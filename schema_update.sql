-- Add new columns to service_plans
ALTER TABLE public.service_plans ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE public.service_plans ADD COLUMN IF NOT EXISTS funding_type TEXT;

-- Create unique index for upsert capability
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_plans_upsert ON public.service_plans (service_id, subscription_type_id, funding_type, age_group);
