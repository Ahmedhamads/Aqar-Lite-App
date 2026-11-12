
import type {
  InstallmentStatus,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";

import {
  countInstallmentsByContract,
  findInstallmentSummary,
  findInstallmentsByContract,
} from "./installment.repository";

import type {
  InstallmentListQuery,
} from "./installment.validation";

interface GetInstallmentsInput {
  companyId: string;
  contractId: string;
  userId: string;
  role: "MANAGER" | "ACCOUNTANT" | "SALES";
  query: InstallmentListQuery;
}

export async function getCompanyContractInstallments(
  input: GetInstallmentsInput,
) {
  // 1. Verify contract ownership and tenant isolation.
  const contract = await prisma.contract.findFirst({
    where: {
      id: input.contractId,
      companyId: input.companyId,
      status: "APPROVED",
      ...(input.role === "SALES" && {
        reservation: {
          is: {
            salesRepId: input.userId,
          },
        },
      }),
    },
    select: {
      id: true,
      finalPrice: true,
      downPayment: true,
    },
  });

  if (!contract) {
    throw new ApiError(
      404,
      "CONTRACT_NOT_FOUND",
      "Contract not found.",
    );
  }

  // 2. Calculate pagination.
  const skip =
    (input.query.page - 1) * input.query.limit;

  // 3. Determine whether overdue filter is requested.
  const overdueOnly =
    input.query.status === "OVERDUE";

  // OVERDUE is not a Prisma enum value.
  const effectiveStatus: InstallmentStatus | undefined =
    input.query.status !== undefined &&
    input.query.status !== "OVERDUE"
      ? input.query.status
      : undefined;

  // Installment.dueDate uses PostgreSQL DATE.
  // Compare calendar dates, not the current time of day.
  const currentDate = new Date();

  const todayUtc = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
    ),
  );

  // 4. Fetch installments, count and summary.
  const [installments, total, summary] =
    await Promise.all([
      findInstallmentsByContract({
        companyId: input.companyId,
        contractId: contract.id,
        ...(effectiveStatus !== undefined && {
          status: effectiveStatus,
        }),
        overdueOnly,
        now: todayUtc,
        skip,
        take: input.query.limit,
        sortOrder: input.query.sortOrder,
      }),

      countInstallmentsByContract({
        companyId: input.companyId,
        contractId: contract.id,
        ...(effectiveStatus !== undefined && {
          status: effectiveStatus,
        }),
        overdueOnly,
        now: todayUtc,
      }),

      findInstallmentSummary(
        input.companyId,
        contract.id,
      ),
    ]);

  // 5. Calculate displayed status and remaining amount.
  const displayedInstallments = installments.map(
    (installment) => {
      const remainingAmount =
        installment.amount.minus(
          installment.paidAmount,
        );

      const isOverdue =
        remainingAmount.greaterThan(0) &&
        installment.dueDate.getTime() < todayUtc.getTime();

      return {
        ...installment,
        status: isOverdue
          ? "OVERDUE" as const
          : installment.status,
        remainingAmount,
      };
    },
  );

  // 6. Calculate financial summary.
  const totalAmount =
    summary._sum.amount ??
    contract.finalPrice.minus(contract.downPayment);

  const paidAmount =
    summary._sum.paidAmount ??
    totalAmount.minus(totalAmount);

  const remainingAmount =
    totalAmount.minus(paidAmount);

  return {
    contract: {
      id: contract.id,
      finalPrice: contract.finalPrice,
      downPayment: contract.downPayment,
    },

    summary: {
      installmentsCount: summary._count.id,
      totalAmount,
      paidAmount,
      remainingAmount,
    },

    installments: displayedInstallments,

    pagination: {
      page: input.query.page,
      limit: input.query.limit,
      total,
      totalPages: Math.ceil(
        total / input.query.limit,
      ),
    },
  };
}
