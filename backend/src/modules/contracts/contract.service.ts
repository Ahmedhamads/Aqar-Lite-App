
import { Prisma } from "../../generated/prisma/client";
import type {
  ContractStatus,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  countContractsByCompany,
  createContractDraft,
  findContractById,
  findContractsByCompany,
} from "./contract.repository";

import type {
  CreateContractInput,
  ContractListQuery,
} from "./contract.validation";

const MAX_DISCOUNT_PERCENT = 5;

// ----------------------------------------
// MONEY HELPERS
// ----------------------------------------

function decimalToCents(value: Prisma.Decimal): bigint {
  return BigInt(value.toFixed(2).replace(".", ""));
}

function centsToDecimal(cents: bigint): Prisma.Decimal {
  const whole = cents / 100n;
  const fraction = (cents % 100n).toString().padStart(2, "0");

  return new Prisma.Decimal(`${whole}.${fraction}`);
}

// ----------------------------------------
// DATE HELPERS
// ----------------------------------------

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(
    Date.UTC(year!, month! - 1, day!),
  );
}

/**
 * Keeps the original day of the month.
 * If that day does not exist in the target month,
 * uses the last day of that month.
 *
 * Example:
 * Jan 31 -> Feb 28 -> Mar 31
 */
function getInstallmentDueDate(
  startDate: Date,
  monthOffset: number,
): Date {
  const year = startDate.getUTCFullYear();
  const month = startDate.getUTCMonth();
  const originalDay = startDate.getUTCDate();

  const targetMonth = month + monthOffset;

  const lastDay = new Date(
    Date.UTC(year, targetMonth + 1, 0),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      year,
      targetMonth,
      Math.min(originalDay, lastDay),
    ),
  );
}

// ----------------------------------------
// UNIT LOCK
// ----------------------------------------

async function lockUnit(
  tx: Prisma.TransactionClient,
  companyId: string,
  unitId: string,
): Promise<void> {
  const units = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Unit"
    WHERE "id" = ${unitId}::uuid
      AND "companyId" = ${companyId}::uuid
    FOR UPDATE
  `;

  if (units.length === 0) {
    throw new ApiError(
      404,
      "UNIT_NOT_FOUND",
      "Unit not found.",
    );
  }
}

// ----------------------------------------
// VALIDATE CONTRACT PRICE
// ----------------------------------------

function validateContractAmounts(
  unitPrice: Prisma.Decimal,
  finalPrice: Prisma.Decimal,
  downPayment: Prisma.Decimal,
): void {
  const unitPriceCents = decimalToCents(unitPrice);
  const finalPriceCents = decimalToCents(finalPrice);
  const downPaymentCents = decimalToCents(downPayment);

  if (finalPriceCents > unitPriceCents) {
    throw new ApiError(
      422,
      "INVALID_FINAL_PRICE",
      "Final price cannot exceed the unit price.",
    );
  }

  const discountCents = unitPriceCents - finalPriceCents;

  if (
    discountCents * 100n >
    unitPriceCents * BigInt(MAX_DISCOUNT_PERCENT)
  ) {
    throw new ApiError(
      422,
      "DISCOUNT_LIMIT_EXCEEDED",
      "Discount cannot exceed 5% of the unit price.",
    );
  }

  if (downPaymentCents > finalPriceCents) {
    throw new ApiError(
      422,
      "INVALID_DOWN_PAYMENT",
      "Down payment cannot exceed the final price.",
    );
  }

  if (downPaymentCents === finalPriceCents) {
    throw new ApiError(
      422,
      "NO_REMAINING_BALANCE",
      "The down payment must be less than the final price.",
    );
  }
}

// ----------------------------------------
// GENERATE INSTALLMENTS
// ----------------------------------------

function generateInstallmentSchedule(input: {
  companyId: string;
  contractId: string;
  finalPrice: Prisma.Decimal;
  downPayment: Prisma.Decimal;
  installmentsCount: number;
  startDate: Date;
}) {
  const finalPriceCents = decimalToCents(input.finalPrice);
  const downPaymentCents = decimalToCents(input.downPayment);

  const remainingCents =
    finalPriceCents - downPaymentCents;

  const count = BigInt(input.installmentsCount);

  const baseAmount = remainingCents / count;
  const remainder = remainingCents % count;

  return Array.from(
    { length: input.installmentsCount },
    (_, index) => {
      const extraCent =
        BigInt(index) < remainder ? 1n : 0n;

      const amountCents = baseAmount + extraCent;

      return {
        companyId: input.companyId,
        contractId: input.contractId,
        sequence: index + 1,
        amount: centsToDecimal(amountCents),
        paidAmount: new Prisma.Decimal("0.00"),
        dueDate: getInstallmentDueDate(
          input.startDate,
          index,
        ),
        status: "PENDING" as const,
      };
    },
  );
}

// ----------------------------------------
// CREATE: Contract Draft
// ----------------------------------------

export async function createCompanyContract(
  companyId: string,
  salesRepId: string,
  input: CreateContractInput,
  ipAddress: string | null = null,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find the reservation without trusting client-supplied ownership.
      const initialReservation = await tx.reservation.findFirst({
        where: {
          id: input.reservationId,
          companyId,
          salesRepId,
        },
        select: {
          unitId: true,
        },
      });

      if (!initialReservation) {
        throw new ApiError(
          404,
          "RESERVATION_NOT_FOUND",
          "Reservation not found.",
        );
      }

      // 2. Lock the unit. Reservation and expiration workflows
      // use the same unit lock.
      await lockUnit(
        tx,
        companyId,
        initialReservation.unitId,
      );

      // 3. Re-read reservation after acquiring the lock.
      const reservation = await tx.reservation.findFirst({
        where: {
          id: input.reservationId,
          companyId,
          salesRepId,
        },
        include: {
          unit: true,
          client: true,
        },
      });

      if (!reservation) {
        throw new ApiError(
          404,
          "RESERVATION_NOT_FOUND",
          "Reservation not found.",
        );
      }

      const now = new Date();

      if (
        reservation.status !== "ACTIVE" ||
        reservation.expiresAt <= now
      ) {
        throw new ApiError(
          409,
          "RESERVATION_NOT_ACTIVE",
          "The reservation is expired or no longer active.",
        );
      }

      if (reservation.unit.status !== "RESERVED") {
        throw new ApiError(
          409,
          "UNIT_NOT_RESERVED",
          "The unit is not currently reserved.",
        );
      }

      // 4. Validate the financial values against the DB unit price.
      const finalPrice = new Prisma.Decimal(input.finalPrice);
      const downPayment = new Prisma.Decimal(input.downPayment);

      validateContractAmounts(
        reservation.unit.price,
        finalPrice,
        downPayment,
      );

      // 5. Create the draft.
      const contract = await createContractDraft(tx, {
        companyId,
        reservationId: reservation.id,
        unitPrice: reservation.unit.price,
        finalPrice,
        downPayment,
        installmentsCount: input.installmentsCount,
        startDate: parseDateOnly(input.startDate),
      });

      // 6. Record audit event.
      await createAuditLog(tx, {
        companyId,
        actorId: salesRepId,
        action: "CONTRACT_CREATED",
        entityType: "Contract",
        entityId: contract.id,
        ipAddress,
        metadata: {
          reservationId: reservation.id,
          unitId: reservation.unitId,
          unitPrice: reservation.unit.price.toString(),
          finalPrice: finalPrice.toString(),
          downPayment: downPayment.toString(),
          installmentsCount: input.installmentsCount,
          startDate: input.startDate,
        },
      });

      return contract;
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "CONTRACT_ALREADY_EXISTS",
        "A contract already exists for this reservation.",
      );
    }

    throw error;
  }
}

// ----------------------------------------
// APPROVE: Contract
// ----------------------------------------

export async function approveCompanyContract(
  companyId: string,
  accountantId: string,
  contractId: string,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    // 1. Find contract and its reservation.
    const initialContract = await tx.contract.findFirst({
      where: {
        id: contractId,
        companyId,
      },
      select: {
        id: true,
        reservationId: true,
      },
    });

    if (!initialContract) {
      throw new ApiError(
        404,
        "CONTRACT_NOT_FOUND",
        "Contract not found.",
      );
    }

    const initialReservation = await tx.reservation.findFirst({
      where: {
        id: initialContract.reservationId,
        companyId,
      },
      select: {
        unitId: true,
      },
    });

    if (!initialReservation) {
      throw new ApiError(
        404,
        "RESERVATION_NOT_FOUND",
        "Reservation not found.",
      );
    }

    // 2. Lock unit to synchronize with reservation operations.
    await lockUnit(
      tx,
      companyId,
      initialReservation.unitId,
    );

    // 3. Read contract and reservation again.
    const contract = await tx.contract.findFirst({
      where: {
        id: contractId,
        companyId,
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

    if (!contract) {
      throw new ApiError(
        404,
        "CONTRACT_NOT_FOUND",
        "Contract not found.",
      );
    }

    if (contract.status !== "DRAFT") {
      throw new ApiError(
        409,
        "CONTRACT_NOT_DRAFT",
        "Only draft contracts can be approved.",
      );
    }

    const now = new Date();

    if (
      contract.reservation.status !== "ACTIVE" ||
      contract.reservation.expiresAt <= now
    ) {
      throw new ApiError(
        409,
        "RESERVATION_NOT_ACTIVE",
        "The reservation has expired or is no longer active.",
      );
    }

    if (contract.reservation.unit.status !== "RESERVED") {
      throw new ApiError(
        409,
        "UNIT_NOT_RESERVED",
        "The unit is not currently reserved.",
      );
    }

    // 4. Revalidate financial amounts before approval.
    validateContractAmounts(
      contract.unitPrice,
      contract.finalPrice,
      contract.downPayment,
    );

    // 5. Approve contract using a conditional update.
    const contractUpdate = await tx.contract.updateMany({
      where: {
        id: contractId,
        companyId,
        status: "DRAFT",
      },
      data: {
        status: "APPROVED",
        approvedById: accountantId,
        approvedAt: now,
      },
    });

    if (contractUpdate.count !== 1) {
      throw new ApiError(
        409,
        "CONTRACT_APPROVAL_CONFLICT",
        "The contract was modified by another request.",
      );
    }

    // 6. Convert reservation.
    const reservationUpdate = await tx.reservation.updateMany({
      where: {
        id: contract.reservationId,
        companyId,
        status: "ACTIVE",
        expiresAt: {
          gt: now,
        },
      },
      data: {
        status: "CONVERTED",
      },
    });

    if (reservationUpdate.count !== 1) {
      throw new ApiError(
        409,
        "RESERVATION_CONVERSION_CONFLICT",
        "The reservation could not be converted.",
      );
    }

    // 7. Mark unit as sold.
    const unitUpdate = await tx.unit.updateMany({
      where: {
        id: contract.reservation.unitId,
        companyId,
        status: "RESERVED",
      },
      data: {
        status: "SOLD",
      },
    });

    if (unitUpdate.count !== 1) {
      throw new ApiError(
        409,
        "UNIT_SALE_CONFLICT",
        "The unit could not be marked as sold.",
      );
    }

    // 8. Generate exact installment schedule.
    const installments = generateInstallmentSchedule({
      companyId,
      contractId,
      finalPrice: contract.finalPrice,
      downPayment: contract.downPayment,
      installmentsCount: contract.installmentsCount,
      startDate: contract.startDate,
    });

    await tx.installment.createMany({
      data: installments,
    });

    // 9. Audit contract approval.
    await createAuditLog(tx, {
      companyId,
      actorId: accountantId,
      action: "CONTRACT_APPROVED",
      entityType: "Contract",
      entityId: contractId,
      ipAddress,
      metadata: {
        reservationId: contract.reservationId,
        unitId: contract.reservation.unitId,
        unitPrice: contract.unitPrice.toString(),
        finalPrice: contract.finalPrice.toString(),
        downPayment: contract.downPayment.toString(),
        installmentsCount: contract.installmentsCount,
        approvedAt: now.toISOString(),
        totalInstallments: installments.length,
      },
    });

    // 10. Audit reservation conversion.
    await createAuditLog(tx, {
      companyId,
      actorId: accountantId,
      action: "RESERVATION_CONVERTED",
      entityType: "Reservation",
      entityId: contract.reservationId,
      ipAddress,
      metadata: {
        contractId,
        unitId: contract.reservation.unitId,
        convertedAt: now.toISOString(),
      },
    });

    // 11. Return approved contract and installment schedule.
    return tx.contract.findFirst({
      where: {
        id: contractId,
        companyId,
      },
      include: {
        reservation: {
          include: {
            unit: true,
            client: true,
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
  });
}

// ----------------------------------------
// READ: List company contracts
// ----------------------------------------

export async function getCompanyContracts(
  companyId: string,
  userId: string,
  role: "MANAGER" | "ACCOUNTANT" | "SALES",
  query: ContractListQuery,
) {
  const salesRepId =
    role === "SALES" ? userId : undefined;

  const filters = {
    companyId,
    ...(salesRepId !== undefined && { salesRepId }),
    ...(query.status !== undefined && {
      status: query.status as ContractStatus,
    }),
  };

  const [items, total] = await Promise.all([
    findContractsByCompany({
      ...filters,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      sortOrder: query.sortOrder,
    }),

    countContractsByCompany(filters),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage: query.page * query.limit < total,
      hasPreviousPage: query.page > 1,
    },
  };
}

// ----------------------------------------
// READ: Get contract by ID
// ----------------------------------------

export async function getCompanyContractById(
  companyId: string,
  contractId: string,
  userId: string,
  role: "MANAGER" | "ACCOUNTANT" | "SALES",
) {
  const contract = await findContractById(
    companyId,
    contractId,
    role === "SALES" ? userId : undefined,
  );

  if (!contract) {
    throw new ApiError(
      404,
      "CONTRACT_NOT_FOUND",
      "Contract not found.",
    );
  }

  return contract;
}
