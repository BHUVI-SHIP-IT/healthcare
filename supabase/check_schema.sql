-- STEP 1: Check what columns actually exist in the User table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: See what's actually in your auth user metadata
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
WHERE id = '8033d61a-35a1-4e6d-bc2f-d10d66ae1acc';

-- STEP 3: Check current User table contents (if any)
SELECT * FROM public."User" LIMIT 5;
