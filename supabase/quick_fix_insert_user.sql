-- ===========================================================
-- QUICK FIX: Insert your user manually (RUN THIS!)
-- ===========================================================

-- First, let's see what columns exist in the User table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'User' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Based on typical schema, try this INSERT:
-- Replace 'Your Full Name' with your actual name
INSERT INTO public."User" (
    id,
    email,
    "fullName",
    role,
    "classSection",
    "createdAt",
    "updatedAt"
)
VALUES (
    '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc',
    'gojo@gmail.com',
    'gojo',
    'STUDENT',
    '3A',  -- or whatever your class section is
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    "updatedAt" = NOW();

-- Verify it worked
SELECT * FROM public."User" WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';
