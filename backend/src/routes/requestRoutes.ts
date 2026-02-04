import { ApprovalDecision, HealthRequestStatus, Prisma, RiskLevel, Role } from "@prisma/client";
import { Router, Request, Response } from "express";
import crypto from "crypto";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { prisma } from "../lib/prisma";
import { logAudit } from "../services/auditService";

const router = Router();

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// List requests for the authenticated user (student or proxy)
router.get(
  "/",
  authenticate,
  authorize([Role.STUDENT, Role.PROXY_STUDENT, Role.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.sub;

      const requests = await prisma.healthRequest.findMany({
        where: {
          OR: [{ studentId: userId }, { proxyId: userId }],
        },
        include: {
          doctorReport: true,
          hodDecision: true,
          exitAuthorization: true,
          caApprovals: true,
          arrivalAcknowledgement: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(requests);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load requests";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/",
  authenticate,
  authorize([Role.STUDENT, Role.PROXY_STUDENT]),
  async (req: Request, res: Response) => {
    try {
      const { symptoms, description, classSection, studentId } = req.body;
      if (!symptoms) {
        return res.status(400).json({ message: "Symptoms are required" });
      }

      const actor = req.user!;
      const targetStudentId = actor.role === Role.STUDENT ? actor.sub : studentId;
      if (!targetStudentId) {
        return res.status(400).json({ message: "studentId is required for proxy submissions" });
      }

      const request = await prisma.healthRequest.create({
        data: {
          studentId: targetStudentId,
          proxyId: actor.role === Role.PROXY_STUDENT ? actor.sub : null,
          symptoms,
          description,
          classSection,
          status: HealthRequestStatus.PENDING_CA,
        },
      });

      await logAudit(actor.sub, "HealthRequest", request.id, "CREATE", { status: request.status });

      return res.status(201).json(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create request";
      return res.status(500).json({ message });
    }
  }
);

router.get(
  "/:id",
  authenticate,
  authorize([
    Role.STUDENT,
    Role.PROXY_STUDENT,
    Role.CLASS_ADVISOR,
    Role.HEALTH_RECEPTIONIST,
    Role.DOCTOR,
    Role.HOD,
    Role.GATE_AUTHORITY,
    Role.ADMIN,
  ]),
  async (req: Request, res: Response) => {
    try {
      const request = await prisma.healthRequest.findUnique({
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load request";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/:id/ca-approval",
  authenticate,
  authorize([Role.CLASS_ADVISOR]),
  async (req: Request, res: Response) => {
    try {
      const { decision, comment } = req.body;
      if (!decision || !Object.values(ApprovalDecision).includes(decision)) {
        return res.status(400).json({ message: "Invalid decision" });
      }

      const request = await prisma.healthRequest.findUnique({ where: { id: req.params.id } });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (
        request.status === HealthRequestStatus.REJECTED ||
        request.status === HealthRequestStatus.CANCELLED ||
        request.status === HealthRequestStatus.COMPLETED
      ) {
        return res.status(400).json({ message: "Request is not actionable" });
      }

      const advisorId = req.user!.sub;

      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const approval = await tx.cAApproval.create({
          data: {
            requestId: request.id,
            advisorId,
            decision,
            comment,
          },
        });

        const nextStatus = decision === ApprovalDecision.APPROVED ? HealthRequestStatus.CA_APPROVED : HealthRequestStatus.REJECTED;

        await tx.healthRequest.update({
          where: { id: request.id },
          data: {
            status: nextStatus,
            caApprovalStartedAt: request.caApprovalStartedAt ?? new Date(),
          },
        });

        return approval;
      });

      await logAudit(advisorId, "HealthRequest", request.id, "CA_APPROVAL", { decision });

      return res.status(201).json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unique constraint")) {
        return res.status(400).json({ message: "Advisor already decided" });
      }
      const message = err instanceof Error ? err.message : "Approval failed";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/:id/arrival-ack",
  authenticate,
  authorize([Role.HEALTH_RECEPTIONIST]),
  async (req: Request, res: Response) => {
    try {
      const request = await prisma.healthRequest.findUnique({ where: { id: req.params.id } });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const ack = await prisma.arrivalAcknowledgement.create({
        data: {
          requestId: request.id,
          receptionistId: req.user!.sub,
        },
      });

      await prisma.healthRequest.update({
        where: { id: request.id },
        data: { status: HealthRequestStatus.RECEPTION_ACK },
      });

      await logAudit(req.user!.sub, "HealthRequest", request.id, "ARRIVAL_ACK");

      return res.status(201).json(ack);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unique constraint")) {
        return res.status(400).json({ message: "Already acknowledged" });
      }
      const message = err instanceof Error ? err.message : "Acknowledgement failed";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/:id/doctor-report",
  authenticate,
  authorize([Role.DOCTOR]),
  async (req: Request, res: Response) => {
    try {
      const { notes, riskLevel } = req.body;
      if (!notes || !riskLevel || !Object.values(RiskLevel).includes(riskLevel)) {
        return res.status(400).json({ message: "Notes and valid riskLevel are required" });
      }

      const request = await prisma.healthRequest.findUnique({ where: { id: req.params.id } });
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      const report = await prisma.doctorReport.create({
        data: {
          requestId: request.id,
          doctorId: req.user!.sub,
          notes,
          riskLevel,
        },
      });

      const nextStatus = riskLevel === RiskLevel.HIGH ? HealthRequestStatus.HOD_REVIEW : HealthRequestStatus.DOCTOR_REVIEW;

      await prisma.healthRequest.update({
        where: { id: request.id },
        data: { status: nextStatus },
      });

      await logAudit(req.user!.sub, "HealthRequest", request.id, "DOCTOR_REPORT", { riskLevel });

      return res.status(201).json(report);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unique constraint")) {
        return res.status(400).json({ message: "Report already submitted" });
      }
      const message = err instanceof Error ? err.message : "Report failed";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/:id/hod-decision",
  authenticate,
  authorize([Role.HOD]),
  async (req: Request, res: Response) => {
    try {
      const { decision, comment } = req.body;
      if (!decision || !Object.values(ApprovalDecision).includes(decision)) {
        return res.status(400).json({ message: "Invalid decision" });
      }

      const request = await prisma.healthRequest.findUnique({
        where: { id: req.params.id },
        include: { doctorReport: true },
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (!request.doctorReport) {
        return res.status(400).json({ message: "Doctor report required" });
      }

      const decisionRecord = await prisma.hODDecision.create({
        data: {
          requestId: request.id,
          hodId: req.user!.sub,
          decision,
          comment,
        },
      });

      await prisma.healthRequest.update({
        where: { id: request.id },
        data: { status: decision === ApprovalDecision.APPROVED ? HealthRequestStatus.HOD_REVIEW : HealthRequestStatus.REJECTED },
      });

      await logAudit(req.user!.sub, "HealthRequest", request.id, "HOD_DECISION", { decision });

      return res.status(201).json(decisionRecord);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Unique constraint")) {
        return res.status(400).json({ message: "Decision already submitted" });
      }
      const message = err instanceof Error ? err.message : "Decision failed";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/:id/authorize-exit",
  authenticate,
  authorize([Role.HEALTH_RECEPTIONIST, Role.ADMIN, Role.DOCTOR]),
  async (req: Request, res: Response) => {
    try {
      const { expiresInMinutes = 120 } = req.body;
      const request = await prisma.healthRequest.findUnique({
        where: { id: req.params.id },
        include: { doctorReport: true, hodDecision: true, exitAuthorization: true },
      });

      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }

      if (!request.doctorReport) {
        return res.status(400).json({ message: "Doctor report required" });
      }

      if (request.doctorReport.riskLevel === RiskLevel.HIGH) {
        if (!request.hodDecision || request.hodDecision.decision !== ApprovalDecision.APPROVED) {
          return res.status(400).json({ message: "HOD approval required for high risk" });
        }
      }

      if (request.exitAuthorization) {
        return res.status(400).json({ message: "Exit already authorized" });
      }

      const rawToken = crypto.randomBytes(24).toString("hex");
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      const auth = await prisma.exitAuthorization.create({
        data: {
          requestId: request.id,
          issuedById: req.user!.sub,
          tokenHash,
          expiresAt,
        },
      });

      await prisma.healthRequest.update({
        where: { id: request.id },
        data: { status: HealthRequestStatus.EXIT_AUTHORIZED },
      });

      await logAudit(req.user!.sub, "HealthRequest", request.id, "EXIT_AUTH_ISSUED", { expiresAt });

      return res.status(201).json({ token: rawToken, authorization: auth });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authorization failed";
      return res.status(500).json({ message });
    }
  }
);

router.post(
  "/gate/scan",
  authenticate,
  authorize([Role.GATE_AUTHORITY]),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }

      const tokenHash = hashToken(token);
      const auth = await prisma.exitAuthorization.findUnique({
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

      const log = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updated = await tx.exitAuthorization.update({
          where: { id: auth.id },
          data: { usedAt: new Date() },
        });

        const gateLog = await tx.gateExitLog.create({
          data: {
            authorizationId: auth.id,
            gateAuthorityId: req.user!.sub,
            success: true,
          },
        });

        await tx.healthRequest.update({
          where: { id: auth.requestId },
          data: { status: HealthRequestStatus.COMPLETED },
        });

        return { updated, gateLog };
      });

      await logAudit(req.user!.sub, "ExitAuthorization", auth.id, "GATE_SCAN_SUCCESS");

      return res.json({ authorization: log.updated, gateLog: log.gateLog });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      return res.status(500).json({ message });
    }
  }
);

export default router;
