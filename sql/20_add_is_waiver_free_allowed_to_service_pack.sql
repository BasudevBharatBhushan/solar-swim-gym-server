-- Migration to add is_waiver_free_allowed to service_pack table
-- Description: add a field if it is allowed to be offered free under state waiver program for state waiver clients, boolean field

ALTER TABLE service_pack 
ADD COLUMN is_waiver_free_allowed BOOLEAN DEFAULT FALSE;
