-- Create ArrivalAcknowledgement table
CREATE TABLE IF NOT EXISTS "ArrivalAcknowledgement" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "receptionistId" UUID NOT NULL REFERENCES "User"("id"),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create DoctorReport table
CREATE TABLE IF NOT EXISTS "DoctorReport" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "doctorId" UUID NOT NULL REFERENCES "User"("id"),
    "notes" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create HODDecision table
CREATE TABLE IF NOT EXISTS "HODDecision" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "hodId" UUID NOT NULL REFERENCES "User"("id"),
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create ExitAuthorization table
CREATE TABLE IF NOT EXISTS "ExitAuthorization" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "receptionistId" UUID NOT NULL REFERENCES "User"("id"),
    "exitToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GateExitLog table
CREATE TABLE IF NOT EXISTS "GateExitLog" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID NOT NULL REFERENCES "HealthRequest"("id"),
    "gateAuthorityId" UUID NOT NULL REFERENCES "User"("id"),
    "exitToken" TEXT NOT NULL,
    "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create AuditLog table if it doesn't exist (it seems commonly used)
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "requestId" UUID REFERENCES "HealthRequest"("id"),
    "userId" UUID REFERENCES "User"("id"),
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Security) - Optional but good practice (can disable later if needed)
ALTER TABLE "ArrivalAcknowledgement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DoctorReport" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HODDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExitAuthorization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GateExitLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Grant access to public (Dropping first to avoid "already exists" errors)
DROP POLICY IF EXISTS "Enable access to all users" ON "ArrivalAcknowledgement";
CREATE POLICY "Enable access to all users" ON "ArrivalAcknowledgement" FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable access to all users" ON "DoctorReport";
CREATE POLICY "Enable access to all users" ON "DoctorReport" FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable access to all users" ON "HODDecision";
CREATE POLICY "Enable access to all users" ON "HODDecision" FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable access to all users" ON "ExitAuthorization";
CREATE POLICY "Enable access to all users" ON "ExitAuthorization" FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable access to all users" ON "GateExitLog";
CREATE POLICY "Enable access to all users" ON "GateExitLog" FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable access to all users" ON "AuditLog";
CREATE POLICY "Enable access to all users" ON "AuditLog" FOR ALL USING (true);
