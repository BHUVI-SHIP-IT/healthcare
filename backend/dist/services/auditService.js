"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const prisma_1 = require("../lib/prisma");
async function logAudit(actorId, entity, entityId, action, payload) {
    await prisma_1.prisma.auditLog.create({
        data: {
            actorId,
            entity,
            entityId,
            action,
            payload,
        },
    });
}
