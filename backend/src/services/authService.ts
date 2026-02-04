import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AuthTokenPayload } from "../types/auth";

interface RegisterInput {
  email: string;
  fullName: string;
  password: string;
  role: Role;
  classSection?: string;
}

export async function registerUser(input: RegisterInput) {
  const normalizedEmail = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new Error("Email already registered");
  }

  if (!Object.values(Role).includes(input.role)) {
    throw new Error("Invalid role");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: input.fullName,
      role: input.role,
      passwordHash,
      classSection: input.classSection,
    },
  });

  const token = signToken(user);

  return { token, user };
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw new Error("Invalid credentials");
  }

  const token = signToken(user);
  return { token, user };
}

function signToken(user: { id: string; email: string; role: Role; fullName: string; classSection?: string | null }) {
  const payload: AuthTokenPayload = { 
    sub: user.id, 
    email: user.email, 
    role: user.role,
    fullName: user.fullName,
    classSection: user.classSection ?? null,
  };
  const expiresIn = env.jwtExpiresIn as SignOptions["expiresIn"];
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
}
