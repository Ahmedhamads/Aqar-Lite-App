
import type { Prisma } from "../../generated/prisma/client";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "USER_CREATED"
  | "CLIENT_CREATED"
  | "CLIENT_UPDATED"
  | "CLIENT_DELETED"
  | "UNIT_CREATED"
  | "UNIT_UPDATED"
  | "UNIT_PRICE_CHANGED"
  | "UNIT_DELETED"
  | "RESERVATION_CREATED"
  | "RESERVATION_EXPIRED"
  | "CONTRACT_CREATED"
  | "CONTRACT_APPROVED"
  | "RESERVATION_CONVERTED"
  | "COMPANY_UPDATED"
  | "USER_UPDATED"
  | "USER_ACTIVATED"
  | "USER_DEACTIVATED"
  | "PAYMENT_CREATED";

export interface CreateAuditLogInput {
  companyId: string;
  actorId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

export interface AuditRequestContext {
  companyId: string;
  actorId: string | null;
  ipAddress: string | null;
}
