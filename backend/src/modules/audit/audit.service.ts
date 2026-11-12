
import {
  countAuditLogs,
  findAuditLogs,
} from "./audit.repository";

import type { AuditListQuery } from "./audit.validation";

interface GetCompanyAuditLogsInput {
  companyId: string;
  query: AuditListQuery;
}

export async function getCompanyAuditLogs({
  companyId,
  query,
}: GetCompanyAuditLogsInput) {
  const [items, total] = await Promise.all([
    findAuditLogs({
      companyId,
      query,
    }),

    countAuditLogs({
      companyId,
      query,
    }),
  ]);

  return {
    items,

    pagination: {
      page: query.page,
      limit: query.limit,
      total,

      totalPages: Math.ceil(
        total / query.limit,
      ),

      hasNextPage:
        query.page * query.limit < total,

      hasPreviousPage:
        query.page > 1,
    },
  };
}
