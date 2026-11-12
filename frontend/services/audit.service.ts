
import { apiClient } from "@/lib/api/client";

import type {
  AuditLogFilters,
  AuditLogsResponse,
} from "@/types/audit-log.types";

function buildQueryString(filters: AuditLogFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.actorId) {
    params.set("actorId", filters.actorId);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const auditService = {
  getAll(filters: AuditLogFilters = {}) {
    return apiClient.get<AuditLogsResponse>(
      `/audit-logs${buildQueryString(filters)}`,
    );
  },
};
