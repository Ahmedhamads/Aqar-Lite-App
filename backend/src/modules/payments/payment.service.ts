
import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  createPaymentAllocations,
  createPaymentRecord,
  findApprovedContract,
  findContractInstallments,
  findCompanyPayments,
  findPaymentByIdempotencyKey,
  lockContractInstallments,
  updateInstallmentPayment,
} from "./payment.repository";
import type { PaymentListQuery } from "./payment.validation";

// ----------------------------------------
// TYPES
// ----------------------------------------

interface CreateCompanyPaymentInput {
  companyId: string;
  accountantId: string;
  contractId: string;
  amount: string;
  idempotencyKey: string;
  ipAddress?: string | null;
}

type PaymentResult = NonNullable<
  Awaited<ReturnType<typeof getPaymentResult>>
>;

async function getPaymentResult(
  paymentId: string,
  companyId: string,
) {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      companyId,
    },
    include: {
      allocations: {
        include: {
          installment: true,
        },
      },
      recordedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

// ----------------------------------------
// IDEMPOTENCY
// ----------------------------------------

function validateIdempotentReplay(
  payment: NonNullable<
    Awaited<ReturnType<typeof findPaymentByIdempotencyKey>>
  >,
  contractId: string,
  amount: Prisma.Decimal,
) {
  const belongsToContract =
    payment.allocations.length > 0 &&
    payment.allocations.every(
      (allocation) =>
        allocation.installment.contractId === contractId,
    );

  const sameAmount = payment.amount.equals(amount);

  if (!belongsToContract || !sameAmount) {
    throw new ApiError(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "This idempotency key has already been used for another payment.",
    );
  }

  return payment;
}

// ----------------------------------------
// CREATE PAYMENT
// ----------------------------------------

export async function createCompanyPayment(
  input: CreateCompanyPaymentInput,
) {
  const amount = new Prisma.Decimal(input.amount);

  try {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Verify the contract belongs to this company.
        const contract = await findApprovedContract(tx, {
          companyId: input.companyId,
          contractId: input.contractId,
        });

        if (!contract) {
          throw new ApiError(
            404,
            "APPROVED_CONTRACT_NOT_FOUND",
            "Approved contract was not found.",
          );
        }

        // 2. Lock installments to prevent concurrent allocation.
        await lockContractInstallments(tx, {
          companyId: input.companyId,
          contractId: input.contractId,
        });

        // 3. Check idempotency after acquiring the lock.
        const existingPayment = await tx.payment.findUnique({
          where: {
            companyId_idempotencyKey: {
              companyId: input.companyId,
              idempotencyKey: input.idempotencyKey,
            },
          },
          include: {
            allocations: {
              include: {
                installment: {
                  select: {
                    contractId: true,
                  },
                },
              },
            },
          },
        });

       if (existingPayment) {
  validateIdempotentReplay(
    existingPayment,
    input.contractId,
    amount,
  );

  return tx.payment.findUniqueOrThrow({
    where: {
      id: existingPayment.id,
    },
    include: {
      allocations: {
        include: {
          installment: true,
        },
      },
      recordedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

        // 4. Read the latest installment balances.
        const installments = await findContractInstallments(
          tx,
          {
            companyId: input.companyId,
            contractId: input.contractId,
          },
        );

        if (installments.length === 0) {
          throw new ApiError(
            409,
            "NO_INSTALLMENTS",
            "This contract has no installments.",
          );
        }

        // 5. Calculate total outstanding balance.
        let totalOutstanding = new Prisma.Decimal(0);

        for (const installment of installments) {
          const balance = installment.amount.minus(
            installment.paidAmount,
          );

          if (balance.lessThan(0)) {
            throw new ApiError(
              409,
              "INVALID_INSTALLMENT_BALANCE",
              "An installment has an invalid paid balance.",
            );
          }

          totalOutstanding = totalOutstanding.plus(balance);
        }

        if (totalOutstanding.isZero()) {
          throw new ApiError(
            409,
            "CONTRACT_FULLY_PAID",
            "All contract installments are already paid.",
          );
        }

        if (amount.greaterThan(totalOutstanding)) {
          throw new ApiError(
            422,
            "PAYMENT_EXCEEDS_BALANCE",
            "Payment amount exceeds the outstanding balance.",
          );
        }

        // 6. Create the payment record.
        const payment = await createPaymentRecord(tx, {
          companyId: input.companyId,
          recordedById: input.accountantId,
          idempotencyKey: input.idempotencyKey,
          amount,
        });

        // 7. Allocate payment to oldest installments first.
        let remainingAmount = amount;

        const allocations: Array<{
          companyId: string;
          paymentId: string;
          installmentId: string;
          amount: Prisma.Decimal;
        }> = [];

        for (const installment of installments) {
          if (remainingAmount.isZero()) {
            break;
          }

          const outstanding = installment.amount.minus(
            installment.paidAmount,
          );

          if (outstanding.isZero()) {
            continue;
          }

          const allocatedAmount = Prisma.Decimal.min(
            remainingAmount,
            outstanding,
          );

          const newPaidAmount = installment.paidAmount.plus(
            allocatedAmount,
          );

          const newStatus = newPaidAmount.equals(
            installment.amount,
          )
            ? "PAID"
            : "PARTIALLY_PAID";

          allocations.push({
            companyId: input.companyId,
            paymentId: payment.id,
            installmentId: installment.id,
            amount: allocatedAmount,
          });

          const updateResult = await updateInstallmentPayment(
            tx,
            {
              companyId: input.companyId,
              installmentId: installment.id,
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          );

          if (updateResult.count !== 1) {
            throw new ApiError(
              409,
              "INSTALLMENT_UPDATE_FAILED",
              "Could not update installment balance.",
            );
          }

          remainingAmount = remainingAmount.minus(
            allocatedAmount,
          );
        }

        // 8. Ensure the entire payment was allocated.
        if (!remainingAmount.isZero()) {
          throw new ApiError(
            409,
            "PAYMENT_ALLOCATION_FAILED",
            "Payment could not be fully allocated.",
          );
        }

        // 9. Persist allocation records.
        await createPaymentAllocations(tx, allocations);

        // 10. Write audit record in the same transaction.
        await createAuditLog(tx, {
          companyId: input.companyId,
          actorId: input.accountantId,
          action: "PAYMENT_CREATED",
          entityType: "Payment",
          entityId: payment.id,
          ipAddress: input.ipAddress ?? null,
          metadata: {
            contractId: input.contractId,
            amount: input.amount,
            allocationCount: allocations.length,
          },
        });

        // 11. Return the complete payment.
        return tx.payment.findUniqueOrThrow({
          where: {
            id: payment.id,
          },
          include: {
            allocations: {
              include: {
                installment: true,
              },
            },
            recordedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      },
    );
  } catch (error: unknown) {
    // A concurrent request may have inserted the same key
    // while this transaction was running.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingPayment = await findPaymentByIdempotencyKey(
        input.companyId,
        input.idempotencyKey,
      );

     if (existingPayment) {
  validateIdempotentReplay(
    existingPayment,
    input.contractId,
    amount,
  );

  const paymentResult = await getPaymentResult(
    existingPayment.id,
    input.companyId,
  );

  if (!paymentResult) {
    throw new ApiError(
      404,
      "PAYMENT_NOT_FOUND",
      "Payment was not found.",
    );
  }

  return paymentResult;
}
    }

    throw error;
  }
}

// ----------------------------------------
// GET COMPANY PAYMENTS
// ----------------------------------------

interface GetCompanyPaymentsInput {
  companyId: string;
  query: PaymentListQuery;
}

export async function getCompanyPayments(
  input: GetCompanyPaymentsInput,
) {
  const { payments, total } = await findCompanyPayments({
    companyId: input.companyId,
    page: input.query.page,
    limit: input.query.limit,
    sortOrder: input.query.sortOrder,
  });

  const totalPages = Math.ceil(
    total / input.query.limit,
  );

  return {
    items: payments,
    pagination: {
      page: input.query.page,
      limit: input.query.limit,
      total,
      totalPages,
      hasNextPage: input.query.page < totalPages,
      hasPreviousPage: input.query.page > 1,
    },
  };
}