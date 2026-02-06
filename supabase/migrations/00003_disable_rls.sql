-- Check if RLS is enabled and disable it for development
-- IMPORTANT: In production, you should enable RLS and create proper policies

-- Disable RLS on all tables for now (development only)
ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."HealthRequest" DISABLE ROW LEVEL SECURITY;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
