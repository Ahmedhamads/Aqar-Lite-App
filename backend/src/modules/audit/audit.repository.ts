
import { prisma } from "../../config/database";

import type { AuditListQuery } from "./audit.validation";

interface FindAuditLogsInput {
  companyId: string;
  query: AuditListQuery;
}

export async function findAuditLogs({
  companyId,
  query,
}: FindAuditLogsInput) {
  const skip = (query.page - 1) * query.limit;

  return prisma.auditLog.findMany({
    where: {
      companyId,

      ...(query.actorId && {
        actorId: query.actorId,
      }),

      ...(query.action && {
        action: query.action,
      }),

      ...(query.entityType && {
        entityType: query.entityType,
      }),

      ...(query.entityId && {
        entityId: query.entityId,
      }),

      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && {
                gte: new Date(query.from),
              }),
              ...(query.to && {
                lte: new Date(query.to),
              }),
            },
          }
        : {}),
    },

    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    skip,
    take: query.limit,
  });
}

export async function countAuditLogs({
  companyId,
  query,
}: FindAuditLogsInput) {
  return prisma.auditLog.count({
    where: {
      companyId,

      ...(query.actorId && {
        actorId: query.actorId,
      }),

      ...(query.action && {
        action: query.action,
      }),

      ...(query.entityType && {
        entityType: query.entityType,
      }),

      ...(query.entityId && {
        entityId: query.entityId,
      }),

      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && {
                gte: new Date(query.from),
              }),
              ...(query.to && {
                lte: new Date(query.to),
              }),
            },
          }
        : {}),
    },
  });
}
