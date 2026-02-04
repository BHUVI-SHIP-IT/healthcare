import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export async function logAudit(
  actorId: string | undefined,
  entity: string,
  entityId: string,
  action: string,
  payload?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      entity,
      entityId,
      action,
      payload,
    },
  });
}
