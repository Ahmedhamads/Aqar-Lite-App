
import type { UserRole } from "./user.types";

export interface AuditActor {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  companyId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: AuditActor | null;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  actorId?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  pagination: AuditLogPagination;
}
