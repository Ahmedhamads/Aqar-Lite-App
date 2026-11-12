
import type {
  InstallmentStatus,
  Prisma,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";

interface FindInstallmentsInput {
  companyId: string;
  contractId: string;
  status?: InstallmentStatus;
  overdueOnly?: boolean;
  now?: Date;
  skip: number;
  take: number;
  sortOrder: "asc" | "desc";
}

interface CountInstallmentsInput {
  companyId: string;
  contractId: string;
  status?: InstallmentStatus;
  overdueOnly?: boolean;
  now?: Date;
}

interface InstallmentWhereInput {
  companyId: string;
  contractId: string;
  status?: InstallmentStatus;
  overdueOnly?: boolean;
  now?: Date;
}

function buildInstallmentWhere(
  input: InstallmentWhereInput,
): Prisma.InstallmentWhereInput {
  if (input.overdueOnly) {
    return {
      companyId: input.companyId,
      contractId: input.contractId,

      // Installments whose due date has passed.
      dueDate: {
        lt: input.now ?? new Date(),
      },

      // OVERDUE is derived, not stored in the database.
      status: {
        in: ["PENDING", "PARTIALLY_PAID"],
      },
    };
  }

  return {
    companyId: input.companyId,
    contractId: input.contractId,
    ...(input.status !== undefined && {
      status: input.status,
    }),
  };
}

// ----------------------------------------
// FIND INSTALLMENTS
// ----------------------------------------

export async function findInstallmentsByContract(
  input: FindInstallmentsInput,
) {
  return prisma.installment.findMany({
    where: buildInstallmentWhere(input),
    select: {
      id: true,
      sequence: true,
      amount: true,
      paidAmount: true,
      dueDate: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { dueDate: input.sortOrder },
      { sequence: input.sortOrder },
    ],
    skip: input.skip,
    take: input.take,
  });
}

// ----------------------------------------
// COUNT INSTALLMENTS
// ----------------------------------------

export async function countInstallmentsByContract(
  input: CountInstallmentsInput,
) {
  return prisma.installment.count({
    where: buildInstallmentWhere(input),
  });
}

// ----------------------------------------
// INSTALLMENT SUMMARY
// ----------------------------------------

export async function findInstallmentSummary(
  companyId: string,
  contractId: string,
) {
  return prisma.installment.aggregate({
    where: {
      companyId,
      contractId,
    },
    _sum: {
      amount: true,
      paidAmount: true,
    },
    _count: {
      id: true,
    },
  });
}
