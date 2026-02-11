-- Add LessonRegistrationFee to service table
ALTER TABLE service ADD COLUMN IF NOT EXISTS "LessonRegistrationFee" DECIMAL(10, 2) DEFAULT 0.00;
