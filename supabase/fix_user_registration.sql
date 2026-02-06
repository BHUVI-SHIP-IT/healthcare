-- IMPORTANT: Run this script in the Supabase SQL Editor
-- This fixes the user registration issue by:
-- 1. Updating the trigger to use 'fullName' instead of 'name'
-- 2. Manually inserting the missing user record

-- Step 1: Fix the trigger to use fullName
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'fullName', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'STUDENT'),
    NEW.raw_user_meta_data->>'classSection',
    NEW.raw_user_meta_data->>'department',
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating user record: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Manually insert the missing user record for the current user
-- This query finds auth users without User table entries and creates them
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
  au.id::text,
  au.email,
  COALESCE(au.raw_user_meta_data->>'fullName', 'User'),
  COALESCE(au.raw_user_meta_data->>'role', 'STUDENT'),
  au.raw_user_meta_data->>'classSection',
  au.raw_user_meta_data->>'department',
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text
WHERE u.id IS NULL;

-- Verify the fix
SELECT 
  au.id as auth_id,
  au.email,
  u.id as user_table_id,
  u.name,
  u.role
FROM auth.users au
LEFT JOIN public."User" u ON u.id = au.id::text;
