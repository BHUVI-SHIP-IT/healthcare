import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const users = [
    { email: "student@example.com", fullName: "Student One", role: Role.STUDENT },
    { email: "proxy@example.com", fullName: "Proxy User", role: Role.PROXY_STUDENT },
    { email: "advisor1@example.com", fullName: "Class Advisor One", role: Role.CLASS_ADVISOR },
    { email: "advisor2@example.com", fullName: "Class Advisor Two", role: Role.CLASS_ADVISOR },
    { email: "reception@example.com", fullName: "Health Reception", role: Role.HEALTH_RECEPTIONIST },
    { email: "doctor@example.com", fullName: "Doctor Who", role: Role.DOCTOR },
    { email: "hod@example.com", fullName: "Head of Dept", role: Role.HOD },
    { email: "gate@example.com", fullName: "Gate Authority", role: Role.GATE_AUTHORITY },
    { email: "admin@example.com", fullName: "System Admin", role: Role.ADMIN },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        passwordHash,
      },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
