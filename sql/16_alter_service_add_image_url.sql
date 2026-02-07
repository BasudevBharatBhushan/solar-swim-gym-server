-- Alter service table to include image_url
-- This migration adds a nullable image_url column to the service table to store the public URL of the uploaded image

ALTER TABLE service ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN service.image_url IS 'Public URL of the service image stored in Supabase Storage';
