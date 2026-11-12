
import { Prisma } from "../../generated/prisma/client";

import type {
  CreateAuditLogInput,
} from "./audit.types";

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  input: CreateAuditLogInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      companyId: input.companyId,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
    },
  });
}
