-- ============================================
-- FINAL FIX v2: Insert user with passwordHash
-- ============================================

INSERT INTO public."User" (
    id,
    email,
    "fullName",
    role,
    "passwordHash",
    "classSection",
    department,
    "createdAt",
    "updatedAt"
)
VALUES (
    '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc',
    'gojo@gmail.com',        -- CHANGE THIS to your email
    'gojo',                  -- CHANGE THIS to your full name
    'STUDENT',               -- Role
    'supabase_auth',         -- Dummy value (not used, auth handled by Supabase)
    '3A',                    -- CHANGE THIS to your class section
    NULL,                    -- Department (NULL for students)
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    "fullName" = EXCLUDED."fullName",
    role = EXCLUDED.role,
    "classSection" = EXCLUDED."classSection",
    department = EXCLUDED.department,
    "updatedAt" = NOW();

-- Verify it worked
SELECT id, email, "fullName", role, "classSection" 
FROM public."User" 
WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';
