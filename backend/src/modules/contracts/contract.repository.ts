
import { Prisma } from "../../generated/prisma/client";
import type { ContractStatus } from "../../generated/prisma/client";

import { prisma } from "../../config/database";

// ----------------------------------------
// TYPES
// ----------------------------------------

interface CreateContractRepositoryInput {
  companyId: string;
  reservationId: string;
  unitPrice: Prisma.Decimal;
  finalPrice: Prisma.Decimal;
  downPayment: Prisma.Decimal;
  installmentsCount: number;
  startDate: Date;
}

interface FindContractsInput {
  companyId: string;
  salesRepId?: string;
  status?: ContractStatus;
  skip: number;
  take: number;
  sortOrder: "asc" | "desc";
}

interface CountContractsInput {
  companyId: string;
  salesRepId?: string;
  status?: ContractStatus;
}

// ----------------------------------------
// CREATE: Contract Draft
// ----------------------------------------

export async function createContractDraft(
  tx: Prisma.TransactionClient,
  input: CreateContractRepositoryInput,
) {
  return tx.contract.create({
    data: {
      companyId: input.companyId,
      reservationId: input.reservationId,
      status: "DRAFT",
      unitPrice: input.unitPrice,
      finalPrice: input.finalPrice,
      downPayment: input.downPayment,
      installmentsCount: input.installmentsCount,
      startDate: input.startDate,
    },
    include: {
      reservation: {
        include: {
          unit: true,
          client: true,
        },
      },
    },
  });
}

// ----------------------------------------
// READ: Find Contracts
// ----------------------------------------

export async function findContractsByCompany(
  input: FindContractsInput,
) {
  const where: Prisma.ContractWhereInput = {
    companyId: input.companyId,

    ...(input.status !== undefined && {
      status: input.status,
    }),

    ...(input.salesRepId !== undefined && {
      reservation: {
        is: {
          salesRepId: input.salesRepId,
        },
      },
    }),
  };

  return prisma.contract.findMany({
    where,
    include: {
      reservation: {
        include: {
          unit: true,
          client: true,
          salesRep: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: input.sortOrder,
    },
    skip: input.skip,
    take: input.take,
  });
}

// ----------------------------------------
// READ: Count Contracts
// ----------------------------------------

export async function countContractsByCompany(
  input: CountContractsInput,
): Promise<number> {
  const where: Prisma.ContractWhereInput = {
    companyId: input.companyId,

    ...(input.status !== undefined && {
      status: input.status,
    }),

    ...(input.salesRepId !== undefined && {
      reservation: {
        is: {
          salesRepId: input.salesRepId,
        },
      },
    }),
  };

  return prisma.contract.count({
    where,
  });
}

// ----------------------------------------
// READ: Find One Contract
// ----------------------------------------

export async function findContractById(
  companyId: string,
  contractId: string,
  salesRepId?: string,
) {
  const where: Prisma.ContractWhereInput = {
    id: contractId,
    companyId,

    ...(salesRepId !== undefined && {
      reservation: {
        is: {
          salesRepId,
        },
      },
    }),
  };

  return prisma.contract.findFirst({
    where,
    include: {
      reservation: {
        include: {
          unit: true,
          client: true,
          salesRep: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      installments: {
        orderBy: {
          sequence: "asc",
        },
      },
    },
  });
}
