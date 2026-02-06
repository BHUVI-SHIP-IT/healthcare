-- DIAGNOSTIC QUERY - Run this first to see what's wrong

-- 1. Check your auth user
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';

-- 2. Check if User table entry exists
SELECT * FROM public."User" WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';

-- 3. Check all users in User table
SELECT id, email, name, role FROM public."User";

-- 4. If no user found, run this INSERT manually:
INSERT INTO public."User" (
    id,
    email,
    name,
    role,
    "classSection",
    department,
    "createdAt",
    "updatedAt"
)
SELECT 
    '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc',
    email,
    COALESCE(raw_user_meta_data->>'fullName', raw_user_meta_data->>'name', 'User'),
    COALESCE(raw_user_meta_data->>'role', 'STUDENT'),
    raw_user_meta_data->>'classSection',
    raw_user_meta_data->>'department',
    NOW(),
    NOW()
FROM auth.users
WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc'
ON CONFLICT (id) DO NOTHING;

-- 5. Verify it was inserted
SELECT * FROM public."User" WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';
