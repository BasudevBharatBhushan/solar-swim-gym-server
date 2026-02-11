-- Make staff password_hash nullable to support account activation flow
ALTER TABLE staff ALTER COLUMN password_hash DROP NOT NULL;
