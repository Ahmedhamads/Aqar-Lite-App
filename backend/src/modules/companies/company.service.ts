
import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  findCompanyById,
  updateCompany,
} from "./company.repository";

export async function getCurrentCompany(companyId: string) {
  const company = await findCompanyById(companyId);

  if (!company) {
    throw new ApiError(
      404,
      "COMPANY_NOT_FOUND",
      "Company not found.",
    );
  }

  return company;
}

export async function updateCurrentCompany(
  companyId: string,
  actorId: string,
  name: string,
  ipAddress?: string | null,
) {
  const currentCompany = await findCompanyById(companyId);

  if (!currentCompany) {
    throw new ApiError(
      404,
      "COMPANY_NOT_FOUND",
      "Company not found.",
    );
  }

  if (currentCompany.name === name) {
    return currentCompany;
  }

  return prisma.$transaction(async (tx) => {
    const result = await updateCompany({
      companyId,
      name,
    });

    if (result.count !== 1) {
      throw new ApiError(
        404,
        "COMPANY_NOT_FOUND",
        "Company not found.",
      );
    }

    await createAuditLog(tx, {
      companyId,
      actorId,
      action: "COMPANY_UPDATED",
      entityType: "Company",
      entityId: companyId,
      ipAddress: ipAddress ?? null,
      metadata: {
        changedFields: ["name"],
        oldName: currentCompany.name,
        newName: name,
      },
    });

    return tx.company.findUniqueOrThrow({
      where: {
        id: companyId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
}
