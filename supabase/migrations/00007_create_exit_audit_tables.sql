-- Create ExitAuthorization table
CREATE TABLE IF NOT EXISTS public."ExitAuthorization" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES public."HealthRequest"("id"),
    "receptionistId" UUID NOT NULL REFERENCES public."User"("id"),
    "exitToken" TEXT NOT NULL,
    "authorizedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AuditLog table
CREATE TABLE IF NOT EXISTS public."AuditLog" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID REFERENCES public."HealthRequest"("id"),
    "userId" UUID REFERENCES public."User"("id"),
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (and then disable for now as per dev mode)
ALTER TABLE public."ExitAuthorization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

-- Disable RLS for development ease (matching 00003_disable_rls.sql pattern)
ALTER TABLE public."ExitAuthorization" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."AuditLog" DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users (so Edge Function can write)
GRANT ALL ON TABLE public."ExitAuthorization" TO authenticated;
GRANT ALL ON TABLE public."AuditLog" TO authenticated;
GRANT ALL ON TABLE public."ExitAuthorization" TO service_role;
GRANT ALL ON TABLE public."AuditLog" TO service_role;
