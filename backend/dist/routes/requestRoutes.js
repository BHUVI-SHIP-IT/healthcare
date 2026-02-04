"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const authenticate_1 = require("../middleware/authenticate");
const authorize_1 = require("../middleware/authorize");
const prisma_1 = require("../lib/prisma");
const auditService_1 = require("../services/auditService");
const router = (0, express_1.Router)();
function hashToken(raw) {
    return crypto_1.default.createHash("sha256").update(raw).digest("hex");
}
router.post("/", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.STUDENT, client_1.Role.PROXY_STUDENT]), async (req, res) => {
    try {
        const { symptoms, description, classSection, studentId } = req.body;
        if (!symptoms) {
            return res.status(400).json({ message: "Symptoms are required" });
        }
        const actor = req.user;
        const targetStudentId = actor.role === client_1.Role.STUDENT ? actor.sub : studentId;
        if (!targetStudentId) {
            return res.status(400).json({ message: "studentId is required for proxy submissions" });
        }
        const request = await prisma_1.prisma.healthRequest.create({
            data: {
                studentId: targetStudentId,
                proxyId: actor.role === client_1.Role.PROXY_STUDENT ? actor.sub : null,
                symptoms,
                description,
                classSection,
                status: client_1.HealthRequestStatus.PENDING_CA,
            },
        });
        await (0, auditService_1.logAudit)(actor.sub, "HealthRequest", request.id, "CREATE", { status: request.status });
        return res.status(201).json(request);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create request";
        return res.status(500).json({ message });
    }
});
router.get("/:id", authenticate_1.authenticate, (0, authorize_1.authorize)([
    client_1.Role.STUDENT,
    client_1.Role.PROXY_STUDENT,
    client_1.Role.CLASS_ADVISOR,
    client_1.Role.HEALTH_RECEPTIONIST,
    client_1.Role.DOCTOR,
    client_1.Role.HOD,
    client_1.Role.GATE_AUTHORITY,
    client_1.Role.ADMIN,
]), async (req, res) => {
    try {
        const request = await prisma_1.prisma.healthRequest.findUnique({
            where: { id: req.params.id },
            include: {
                caApprovals: true,
                arrivalAcknowledgement: true,
                doctorReport: true,
                hodDecision: true,
                exitAuthorization: true,
            },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        return res.json(request);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load request";
        return res.status(500).json({ message });
    }
});
router.post("/:id/ca-approval", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.CLASS_ADVISOR]), async (req, res) => {
    try {
        const { decision, comment } = req.body;
        if (!decision || !Object.values(client_1.ApprovalDecision).includes(decision)) {
            return res.status(400).json({ message: "Invalid decision" });
        }
        const request = await prisma_1.prisma.healthRequest.findUnique({ where: { id: req.params.id } });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (request.status === client_1.HealthRequestStatus.REJECTED ||
            request.status === client_1.HealthRequestStatus.CANCELLED ||
            request.status === client_1.HealthRequestStatus.COMPLETED) {
            return res.status(400).json({ message: "Request is not actionable" });
        }
        const advisorId = req.user.sub;
        const result = await prisma_1.prisma.$transaction(async (tx) => {
            const approval = await tx.cAApproval.create({
                data: {
                    requestId: request.id,
                    advisorId,
                    decision,
                    comment,
                },
            });
            const nextStatus = decision === client_1.ApprovalDecision.APPROVED ? client_1.HealthRequestStatus.CA_APPROVED : client_1.HealthRequestStatus.REJECTED;
            await tx.healthRequest.update({
                where: { id: request.id },
                data: {
                    status: nextStatus,
                    caApprovalStartedAt: request.caApprovalStartedAt ?? new Date(),
                },
            });
            return approval;
        });
        await (0, auditService_1.logAudit)(advisorId, "HealthRequest", request.id, "CA_APPROVAL", { decision });
        return res.status(201).json(result);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("Unique constraint")) {
            return res.status(400).json({ message: "Advisor already decided" });
        }
        const message = err instanceof Error ? err.message : "Approval failed";
        return res.status(500).json({ message });
    }
});
router.post("/:id/arrival-ack", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.HEALTH_RECEPTIONIST]), async (req, res) => {
    try {
        const request = await prisma_1.prisma.healthRequest.findUnique({ where: { id: req.params.id } });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        const ack = await prisma_1.prisma.arrivalAcknowledgement.create({
            data: {
                requestId: request.id,
                receptionistId: req.user.sub,
            },
        });
        await prisma_1.prisma.healthRequest.update({
            where: { id: request.id },
            data: { status: client_1.HealthRequestStatus.RECEPTION_ACK },
        });
        await (0, auditService_1.logAudit)(req.user.sub, "HealthRequest", request.id, "ARRIVAL_ACK");
        return res.status(201).json(ack);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("Unique constraint")) {
            return res.status(400).json({ message: "Already acknowledged" });
        }
        const message = err instanceof Error ? err.message : "Acknowledgement failed";
        return res.status(500).json({ message });
    }
});
router.post("/:id/doctor-report", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.DOCTOR]), async (req, res) => {
    try {
        const { notes, riskLevel } = req.body;
        if (!notes || !riskLevel || !Object.values(client_1.RiskLevel).includes(riskLevel)) {
            return res.status(400).json({ message: "Notes and valid riskLevel are required" });
        }
        const request = await prisma_1.prisma.healthRequest.findUnique({ where: { id: req.params.id } });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        const report = await prisma_1.prisma.doctorReport.create({
            data: {
                requestId: request.id,
                doctorId: req.user.sub,
                notes,
                riskLevel,
            },
        });
        const nextStatus = riskLevel === client_1.RiskLevel.HIGH ? client_1.HealthRequestStatus.HOD_REVIEW : client_1.HealthRequestStatus.DOCTOR_REVIEW;
        await prisma_1.prisma.healthRequest.update({
            where: { id: request.id },
            data: { status: nextStatus },
        });
        await (0, auditService_1.logAudit)(req.user.sub, "HealthRequest", request.id, "DOCTOR_REPORT", { riskLevel });
        return res.status(201).json(report);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("Unique constraint")) {
            return res.status(400).json({ message: "Report already submitted" });
        }
        const message = err instanceof Error ? err.message : "Report failed";
        return res.status(500).json({ message });
    }
});
router.post("/:id/hod-decision", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.HOD]), async (req, res) => {
    try {
        const { decision, comment } = req.body;
        if (!decision || !Object.values(client_1.ApprovalDecision).includes(decision)) {
            return res.status(400).json({ message: "Invalid decision" });
        }
        const request = await prisma_1.prisma.healthRequest.findUnique({
            where: { id: req.params.id },
            include: { doctorReport: true },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (!request.doctorReport) {
            return res.status(400).json({ message: "Doctor report required" });
        }
        const decisionRecord = await prisma_1.prisma.hODDecision.create({
            data: {
                requestId: request.id,
                hodId: req.user.sub,
                decision,
                comment,
            },
        });
        await prisma_1.prisma.healthRequest.update({
            where: { id: request.id },
            data: { status: decision === client_1.ApprovalDecision.APPROVED ? client_1.HealthRequestStatus.HOD_REVIEW : client_1.HealthRequestStatus.REJECTED },
        });
        await (0, auditService_1.logAudit)(req.user.sub, "HealthRequest", request.id, "HOD_DECISION", { decision });
        return res.status(201).json(decisionRecord);
    }
    catch (err) {
        if (err instanceof Error && err.message.includes("Unique constraint")) {
            return res.status(400).json({ message: "Decision already submitted" });
        }
        const message = err instanceof Error ? err.message : "Decision failed";
        return res.status(500).json({ message });
    }
});
router.post("/:id/authorize-exit", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.HEALTH_RECEPTIONIST, client_1.Role.ADMIN, client_1.Role.DOCTOR]), async (req, res) => {
    try {
        const { expiresInMinutes = 120 } = req.body;
        const request = await prisma_1.prisma.healthRequest.findUnique({
            where: { id: req.params.id },
            include: { doctorReport: true, hodDecision: true, exitAuthorization: true },
        });
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        if (!request.doctorReport) {
            return res.status(400).json({ message: "Doctor report required" });
        }
        if (request.doctorReport.riskLevel === client_1.RiskLevel.HIGH) {
            if (!request.hodDecision || request.hodDecision.decision !== client_1.ApprovalDecision.APPROVED) {
                return res.status(400).json({ message: "HOD approval required for high risk" });
            }
        }
        if (request.exitAuthorization) {
            return res.status(400).json({ message: "Exit already authorized" });
        }
        const rawToken = crypto_1.default.randomBytes(24).toString("hex");
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        const auth = await prisma_1.prisma.exitAuthorization.create({
            data: {
                requestId: request.id,
                issuedById: req.user.sub,
                tokenHash,
                expiresAt,
            },
        });
        await prisma_1.prisma.healthRequest.update({
            where: { id: request.id },
            data: { status: client_1.HealthRequestStatus.EXIT_AUTHORIZED },
        });
        await (0, auditService_1.logAudit)(req.user.sub, "HealthRequest", request.id, "EXIT_AUTH_ISSUED", { expiresAt });
        return res.status(201).json({ token: rawToken, authorization: auth });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Authorization failed";
        return res.status(500).json({ message });
    }
});
router.post("/gate/scan", authenticate_1.authenticate, (0, authorize_1.authorize)([client_1.Role.GATE_AUTHORITY]), async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token required" });
        }
        const tokenHash = hashToken(token);
        const auth = await prisma_1.prisma.exitAuthorization.findUnique({
            where: { tokenHash },
            include: { request: true },
        });
        if (!auth) {
            return res.status(404).json({ message: "Authorization not found" });
        }
        if (auth.revokedAt) {
            return res.status(400).json({ message: "Authorization revoked" });
        }
        if (auth.usedAt) {
            return res.status(410).json({ message: "Token already used" });
        }
        if (auth.expiresAt < new Date()) {
            return res.status(410).json({ message: "Token expired" });
        }
        const log = await prisma_1.prisma.$transaction(async (tx) => {
            const updated = await tx.exitAuthorization.update({
                where: { id: auth.id },
                data: { usedAt: new Date() },
            });
            const gateLog = await tx.gateExitLog.create({
                data: {
                    authorizationId: auth.id,
                    gateAuthorityId: req.user.sub,
                    success: true,
                },
            });
            await tx.healthRequest.update({
                where: { id: auth.requestId },
                data: { status: client_1.HealthRequestStatus.COMPLETED },
            });
            return { updated, gateLog };
        });
        await (0, auditService_1.logAudit)(req.user.sub, "ExitAuthorization", auth.id, "GATE_SCAN_SUCCESS");
        return res.json({ authorization: log.updated, gateLog: log.gateLog });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Scan failed";
        return res.status(500).json({ message });
    }
});
exports.default = router;
