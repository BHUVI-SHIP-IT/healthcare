import { Role } from "@prisma/client";

export interface AuthTokenPayload {
  sub: string;
  role: Role;
  email: string;
  fullName: string;
  classSection?: string | null;
}
