-- Phase 1: Add department column to User table
-- This enables HODs to be assigned to specific departments

ALTER TABLE public."User" 
ADD COLUMN IF NOT EXISTS department TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('classSection', 'department');

-- The classSection format should be: "YEAR_SECTION_DEPARTMENT"
-- Examples: "2ND_YEAR_O_CSE", "3RD_YEAR_A_ECE", "1ST_YEAR_B_MECH"
