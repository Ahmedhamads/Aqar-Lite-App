
import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  countReservationsByCompany,
  findReservationById,
  findReservationsByCompany,
} from "./reservation.repository";

import type {
  CreateReservationInput,
  ReservationListQuery,
} from "./reservation.validation";

const RESERVATION_DURATION_HOURS = 72;

const RESERVATION_DURATION_MS =
  RESERVATION_DURATION_HOURS * 60 * 60 * 1000;

// ----------------------------------------
// LOCK: Lock unit row
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
// EXPIRATION: Expire reservations for unit
// ----------------------------------------

async function expireUnitReservation(
  tx: Prisma.TransactionClient,
  companyId: string,
  unitId: string,
  now: Date,
): Promise<void> {
  // Find all reservations that are eligible for expiration.
  const expiredReservations = await tx.reservation.findMany({
    where: {
      companyId,
      unitId,
      status: "ACTIVE",
      expiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      clientId: true,
      salesRepId: true,
      expiresAt: true,
    },
  });

  if (expiredReservations.length > 0) {
    await tx.reservation.updateMany({
      where: {
        companyId,
        unitId,
        status: "ACTIVE",
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Record one audit event for each expired reservation.
    for (const reservation of expiredReservations) {
      await createAuditLog(tx, {
        companyId,
        actorId: null,
        action: "RESERVATION_EXPIRED",
        entityType: "Reservation",
        entityId: reservation.id,
        metadata: {
          unitId,
          clientId: reservation.clientId,
          salesRepId: reservation.salesRepId,
          expiresAt: reservation.expiresAt.toISOString(),
          expiredAt: now.toISOString(),
          triggeredBy: "SYSTEM",
        },
      });
    }
  }

  // Check whether another active reservation still exists.
  const activeReservationCount =
    await tx.reservation.count({
      where: {
        companyId,
        unitId,
        status: "ACTIVE",
        expiresAt: {
          gt: now,
        },
      },
    });

  // Release the unit only if no active reservation remains.
  if (activeReservationCount === 0) {
    await tx.unit.updateMany({
      where: {
        id: unitId,
        companyId,
        status: "RESERVED",
      },
      data: {
        status: "AVAILABLE",
      },
    });
  }
}

// ----------------------------------------
// CREATE: Create reservation
// ----------------------------------------

export async function createCompanyReservation(
  companyId: string,
  salesRepId: string,
  input: CreateReservationInput,
  ipAddress: string | null = null,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate client ownership.
      const client = await tx.client.findFirst({
        where: {
          id: input.clientId,
          companyId,
          salesRepId,
        },
        select: {
          id: true,
        },
      });

      if (!client) {
        throw new ApiError(
          404,
          "CLIENT_NOT_FOUND",
          "Client not found.",
        );
      }

      // 2. Lock the unit row before checking availability.
      await lockUnit(
        tx,
        companyId,
        input.unitId,
      );

      // Calculate current time after acquiring the lock.
      const now = new Date();

      // 3. Expire previous reservations.
      await expireUnitReservation(
        tx,
        companyId,
        input.unitId,
        now,
      );

      // 4. Atomically claim the available unit.
      const claimResult = await tx.unit.updateMany({
        where: {
          id: input.unitId,
          companyId,
          status: "AVAILABLE",
        },
        data: {
          status: "RESERVED",
        },
      });

      if (claimResult.count !== 1) {
        throw new ApiError(
          409,
          "UNIT_NOT_AVAILABLE",
          "This unit is not available for reservation.",
        );
      }

      // 5. Create a reservation for exactly 72 hours.
      const expiresAt = new Date(
        now.getTime() + RESERVATION_DURATION_MS,
      );

      const reservation = await tx.reservation.create({
        data: {
          companyId,
          unitId: input.unitId,
          clientId: input.clientId,
          salesRepId,
          status: "ACTIVE",
          expiresAt,
        },
        include: {
          unit: true,
          client: true,
        },
      });

      // 6. Record reservation creation.
      await createAuditLog(tx, {
        companyId,
        actorId: salesRepId,
        action: "RESERVATION_CREATED",
        entityType: "Reservation",
        entityId: reservation.id,
        ipAddress,
        metadata: {
          unitId: reservation.unitId,
          clientId: reservation.clientId,
          expiresAt: reservation.expiresAt.toISOString(),
          durationHours: RESERVATION_DURATION_HOURS,
        },
      });

      return reservation;
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "UNIT_ALREADY_RESERVED",
        "This unit already has an active reservation.",
      );
    }

    throw error;
  }
}

// ----------------------------------------
// READ: List company reservations
// ----------------------------------------

export async function getCompanyReservations(
  companyId: string,
  userId: string,
  role: "MANAGER" | "ACCOUNTANT" | "SALES",
  query: ReservationListQuery,
) {
  // Expire old reservations before returning the list.
  await expireCompanyReservations(companyId);

  const salesRepId =
    role === "SALES" ? userId : undefined;

  const filters = {
    companyId,
    ...(salesRepId && { salesRepId }),
    ...(query.status && { status: query.status }),
  };

  const [items, total] = await Promise.all([
    findReservationsByCompany({
      ...filters,
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
    }),

    countReservationsByCompany(filters),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      hasNextPage:
        query.page * query.limit < total,
      hasPreviousPage: query.page > 1,
    },
  };
}

// ----------------------------------------
// EXPIRATION: Expire company reservations
// ----------------------------------------

async function expireCompanyReservations(
  companyId: string,
): Promise<void> {
  const now = new Date();

  const expiredUnits = await prisma.reservation.findMany({
    where: {
      companyId,
      status: "ACTIVE",
      expiresAt: {
        lte: now,
      },
    },
    select: {
      unitId: true,
    },
    distinct: ["unitId"],
  });

  for (const reservation of expiredUnits) {
    await prisma.$transaction(async (tx) => {
      await lockUnit(
        tx,
        companyId,
        reservation.unitId,
      );

      // Recalculate time after acquiring the lock.
      const currentTime = new Date();

      await expireUnitReservation(
        tx,
        companyId,
        reservation.unitId,
        currentTime,
      );
    });
  }
}

// ----------------------------------------
// READ: Get reservation by ID
// ----------------------------------------

export async function getCompanyReservationById(
  companyId: string,
  reservationId: string,
  userId: string,
  role: "MANAGER" | "ACCOUNTANT" | "SALES",
) {
  const reservation = await findReservationById(
    companyId,
    reservationId,
    role === "SALES" ? userId : undefined,
  );

  if (!reservation) {
    throw new ApiError(
      404,
      "RESERVATION_NOT_FOUND",
      "Reservation not found.",
    );
  }

  if (
    reservation.status === "ACTIVE" &&
    reservation.expiresAt <= new Date()
  ) {
    await prisma.$transaction(async (tx) => {
      await lockUnit(
        tx,
        companyId,
        reservation.unitId,
      );

      const now = new Date();

      await expireUnitReservation(
        tx,
        companyId,
        reservation.unitId,
        now,
      );
    });

    return findReservationById(
      companyId,
      reservationId,
      role === "SALES" ? userId : undefined,
    );
  }

  return reservation;
}
