export enum Role {
  STUDENT = 'STUDENT',
  PROXY_STUDENT = 'PROXY_STUDENT',
  CLASS_ADVISOR = 'CLASS_ADVISOR',
  HEALTH_RECEPTIONIST = 'HEALTH_RECEPTIONIST',
  DOCTOR = 'DOCTOR',
  HOD = 'HOD',
  GATE_AUTHORITY = 'GATE_AUTHORITY',
  ADMIN = 'ADMIN',
}

export enum HealthRequestStatus {
  PENDING_CA = 'PENDING_CA',
  CA_APPROVED = 'CA_APPROVED',
  RECEPTION_ACK = 'RECEPTION_ACK',
  DOCTOR_REVIEW = 'DOCTOR_REVIEW',
  HOD_REVIEW = 'HOD_REVIEW',
  EXIT_AUTHORIZED = 'EXIT_AUTHORIZED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  classSection?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRequest {
  id: string;
  studentId: string;
  proxyId?: string;
  symptoms: string;
  description?: string;
  status: HealthRequestStatus;
  classSection?: string;
  createdAt: string;
  updatedAt: string;
  student?: User;
  proxy?: User;
  caApprovals?: CAApproval[];
  arrivalAcknowledgement?: ArrivalAcknowledgement;
  doctorReport?: DoctorReport;
  hodDecision?: HODDecision;
  exitAuthorization?: ExitAuthorization;
}

export interface CAApproval {
  id: string;
  requestId: string;
  advisorId: string;
  decision: ApprovalDecision;
  comment?: string;
  decidedAt: string;
  advisor?: User;
}

export interface ArrivalAcknowledgement {
  id: string;
  requestId: string;
  receptionistId: string;
  acknowledgedAt: string;
  receptionist?: User;
}

export interface DoctorReport {
  id: string;
  requestId: string;
  doctorId: string;
  notes: string;
  riskLevel: RiskLevel;
  createdAt: string;
  doctor?: User;
}

export interface HODDecision {
  id: string;
  requestId: string;
  hodId: string;
  decision: ApprovalDecision;
  comment?: string;
  decidedAt: string;
  hod?: User;
}

export interface ExitAuthorization {
  id: string;
  requestId: string;
  issuedById?: string;
  tokenHash: string;
  expiresAt: string;
  issuedAt: string;
  usedAt?: string;
  revokedAt?: string;
  issuedBy?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  classSection?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateHealthRequestDto {
  symptoms: string;
  description?: string;
  classSection?: string;
  studentId?: string;
}

export interface CAApprovalDto {
  decision: ApprovalDecision;
  comment?: string;
}

export interface DoctorReportDto {
  notes: string;
  riskLevel: RiskLevel;
}

export interface HODDecisionDto {
  decision: ApprovalDecision;
  comment?: string;
}

export interface GateScanDto {
  token: string;
}
