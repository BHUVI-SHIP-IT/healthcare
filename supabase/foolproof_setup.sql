-- Super Safe Table Setup Script
-- This script uses anonymous code blocks to handle errors gracefully
-- It will create tables if they don't exist, and policies if they don't exist
-- It will NOT fail if something already exists.

-- 1. ArrivalAcknowledgement
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "ArrivalAcknowledgement" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "receptionistId" UUID NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- 2. DoctorReport
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "DoctorReport" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "doctorId" UUID NOT NULL REFERENCES "User"("id"),
    "notes" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- 3. HODDecision
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "HODDecision" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "hodId" UUID NOT NULL REFERENCES "User"("id"),
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- 4. ExitAuthorization
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "ExitAuthorization" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "receptionistId" UUID NOT NULL REFERENCES "User"("id"),
    "exitToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- 5. GateExitLog
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "GateExitLog" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "gateAuthorityId" UUID NOT NULL REFERENCES "User"("id"),
    "exitToken" TEXT NOT NULL,
    "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- 6. AuditLog
do $$ 
begin
  CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID REFERENCES "HealthRequest"("id"),
    "userId" UUID REFERENCES "User"("id"),
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
  );
exception when others then null;
end $$;

-- Enable RLS
ALTER TABLE "ArrivalAcknowledgement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HODDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExitAuthorization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GateExitLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Safely create policies
do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "ArrivalAcknowledgement";
  CREATE POLICY "Enable access to all users" ON "ArrivalAcknowledgement" FOR ALL USING (true);
exception when others then null;
end $$;

do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "DoctorReport";
  CREATE POLICY "Enable access to all users" ON "DoctorReport" FOR ALL USING (true);
exception when others then null;
end $$;

do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "HODDecision";
  CREATE POLICY "Enable access to all users" ON "HODDecision" FOR ALL USING (true);
exception when others then null;
end $$;

do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "ExitAuthorization";
  CREATE POLICY "Enable access to all users" ON "ExitAuthorization" FOR ALL USING (true);
exception when others then null;
end $$;

do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "GateExitLog";
  CREATE POLICY "Enable access to all users" ON "GateExitLog" FOR ALL USING (true);
exception when others then null;
end $$;

do $$ 
begin
  DROP POLICY IF EXISTS "Enable access to all users" ON "AuditLog";
  CREATE POLICY "Enable access to all users" ON "AuditLog" FOR ALL USING (true);
exception when others then null;
end $$;
