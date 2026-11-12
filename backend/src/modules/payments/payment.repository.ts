
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../config/database";
interface FindContractInput {
  companyId: string;
  contractId: string;
}

interface CreatePaymentInput {
  companyId: string;
  recordedById: string;
  idempotencyKey: string;
  amount: Prisma.Decimal;
}

interface CreateAllocationInput {
  companyId: string;
  paymentId: string;
  installmentId: string;
  amount: Prisma.Decimal;
}

interface UpdateInstallmentPaymentInput {
  companyId: string;
  installmentId: string;
  paidAmount: Prisma.Decimal;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID";
}

// ----------------------------------------
// FIND APPROVED CONTRACT
// ----------------------------------------

export async function findApprovedContract(
  tx: Prisma.TransactionClient,
  input: FindContractInput,
) {
  return tx.contract.findFirst({
    where: {
      id: input.contractId,
      companyId: input.companyId,
      status: "APPROVED",
    },
    select: {
      id: true,
      companyId: true,
      finalPrice: true,
      downPayment: true,
    },
  });
}

// ----------------------------------------
// LOCK INSTALLMENTS
// ----------------------------------------

export async function lockContractInstallments(
  tx: Prisma.TransactionClient,
  input: FindContractInput,
): Promise<void> {
  await tx.$queryRaw`
    SELECT id
    FROM "Installment"
    WHERE "contractId" = ${input.contractId}::uuid
      AND "companyId" = ${input.companyId}::uuid
    ORDER BY sequence ASC
    FOR UPDATE
  `;
}

// ----------------------------------------
// FIND INSTALLMENTS
// ----------------------------------------

export async function findContractInstallments(
  tx: Prisma.TransactionClient,
  input: FindContractInput,
) {
  return tx.installment.findMany({
    where: {
      contractId: input.contractId,
      companyId: input.companyId,
    },
    orderBy: {
      sequence: "asc",
    },
  });
}

// ----------------------------------------
// CREATE PAYMENT
// ----------------------------------------

export async function createPaymentRecord(
  tx: Prisma.TransactionClient,
  input: CreatePaymentInput,
) {
  return tx.payment.create({
    data: {
      companyId: input.companyId,
      recordedById: input.recordedById,
      idempotencyKey: input.idempotencyKey,
      amount: input.amount,
    },
  });
}

// ----------------------------------------
// CREATE PAYMENT ALLOCATIONS
// ----------------------------------------

export async function createPaymentAllocations(
  tx: Prisma.TransactionClient,
  allocations: CreateAllocationInput[],
): Promise<void> {
  if (allocations.length === 0) {
    return;
  }

  await tx.paymentAllocation.createMany({
    data: allocations,
  });
}

// ----------------------------------------
// UPDATE INSTALLMENT
// ----------------------------------------

export async function updateInstallmentPayment(
  tx: Prisma.TransactionClient,
  input: UpdateInstallmentPaymentInput,
) {
  return tx.installment.updateMany({
    where: {
      id: input.installmentId,
      companyId: input.companyId,
    },
    data: {
      paidAmount: input.paidAmount,
      status: input.status,
    },
  });
}


export async function findPaymentByIdempotencyKey(
  companyId: string,
  idempotencyKey: string,
) {
  return prisma.payment.findUnique({
    where: {
      companyId_idempotencyKey: {
        companyId,
        idempotencyKey,
      },
    },
    include: {
      allocations: {
        include: {
          installment: {
            select: {
              id: true,
              contractId: true,
              sequence: true,
              amount: true,
              paidAmount: true,
              status: true,
            },
          },
        },
      },
    },
  });
}

// ----------------------------------------
// FIND COMPANY PAYMENTS
// ----------------------------------------

interface FindCompanyPaymentsInput {
  companyId: string;
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export async function findCompanyPayments(
  input: FindCompanyPaymentsInput,
) {
  const skip = (input.page - 1) * input.limit;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: {
        companyId: input.companyId,
      },
      skip,
      take: input.limit,
      orderBy: {
        createdAt: input.sortOrder,
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        allocations: {
          include: {
            installment: {
              include: {
                contract: {
                  include: {
                    reservation: {
                      include: {
                        client: {
                          select: {
                            id: true,
                            name: true,
                            phone: true,
                          },
                        },
                        unit: {
                          select: {
                            id: true,
                            projectName: true,
                            unitNumber: true,
                            type: true,
                            area: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.payment.count({
      where: {
        companyId: input.companyId,
      },
    }),
  ]);

  return {
    payments,
    total,
  };
}