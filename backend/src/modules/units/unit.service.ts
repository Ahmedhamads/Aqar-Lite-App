
import { Prisma } from "../../generated/prisma/client";
import type { UnitStatus } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  countUnitsByCompany,
  findUnitById,
  findUnitsByCompany,
} from "./unit.repository";

import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "./unit.validation";

// ----------------------------------------
// READ: List company units
// ----------------------------------------

interface GetUnitsInput {
  companyId: string;
  page: number;
  limit: number;
  status?: UnitStatus;
  minPrice?: string;
  maxPrice?: string;
  sortBy: "price" | "area";
  sortOrder: "asc" | "desc";
}

export async function getCompanyUnits(input: GetUnitsInput) {
  const skip = (input.page - 1) * input.limit;

  const filters = {
    ...(input.status !== undefined
      ? { status: input.status }
      : {}),
    ...(input.minPrice !== undefined
      ? { minPrice: input.minPrice }
      : {}),
    ...(input.maxPrice !== undefined
      ? { maxPrice: input.maxPrice }
      : {}),
  };

  const [units, total] = await Promise.all([
    findUnitsByCompany({
      ...input,
      skip,
      take: input.limit,
    }),
    countUnitsByCompany(input.companyId, filters),
  ]);

  return {
    items: units,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      totalPages: Math.ceil(total / input.limit),
      hasNextPage: input.page * input.limit < total,
      hasPreviousPage: input.page > 1,
    },
  };
}

// ----------------------------------------
// READ: Get one company unit
// ----------------------------------------

export async function getCompanyUnitById(
  companyId: string,
  unitId: string,
) {
  return findUnitById(companyId, unitId);
}

// ----------------------------------------
// CREATE: Create unit
// ----------------------------------------

export async function createCompanyUnit(
  companyId: string,
  input: CreateUnitInput,
  actorId: string,
  ipAddress: string | null = null,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const unit = await tx.unit.create({
        data: {
          companyId,
          projectName: input.projectName,
          unitNumber: input.unitNumber,
          type: input.type,
          area: new Prisma.Decimal(input.area),
          rooms: input.rooms,
          price: new Prisma.Decimal(input.price),
        },
      });

      await createAuditLog(tx, {
        companyId,
        actorId,
        action: "UNIT_CREATED",
        entityType: "Unit",
        entityId: unit.id,
        ipAddress,
        metadata: {
          projectName: unit.projectName,
          unitNumber: unit.unitNumber,
          type: unit.type,
          area: unit.area.toString(),
          rooms: unit.rooms,
          price: unit.price.toString(),
          status: unit.status,
        },
      });

      return unit;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "UNIT_ALREADY_EXISTS",
        "A unit with this number already exists in this project.",
      );
    }

    throw error;
  }
}

// ----------------------------------------
// UPDATE: Update unit
// ----------------------------------------

export async function updateCompanyUnit(
  companyId: string,
  actorId: string,
  unitId: string,
  input: UpdateUnitInput,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    const existingUnit = await tx.unit.findFirst({
      where: {
        id: unitId,
        companyId,
      },
    });

    if (!existingUnit) {
      throw new ApiError(
        404,
        "UNIT_NOT_FOUND",
        "Unit not found.",
      );
    }

    const newPrice =
      input.price !== undefined
        ? new Prisma.Decimal(input.price)
        : undefined;

    const priceChanged =
      newPrice !== undefined &&
      !existingUnit.price.equals(newPrice);

    if (priceChanged && existingUnit.status !== "AVAILABLE") {
      throw new ApiError(
        409,
        "UNIT_PRICE_LOCKED",
        "Unit price cannot be changed unless the unit is available.",
      );
    }

    const data: Prisma.UnitUpdateManyMutationInput = {
      ...(input.projectName !== undefined && {
        projectName: input.projectName,
      }),
      ...(input.unitNumber !== undefined && {
        unitNumber: input.unitNumber,
      }),
      ...(input.type !== undefined && {
        type: input.type,
      }),
      ...(input.area !== undefined && {
        area: new Prisma.Decimal(input.area),
      }),
      ...(input.rooms !== undefined && {
        rooms: input.rooms,
      }),
      ...(newPrice !== undefined && {
        price: newPrice,
      }),
    };

    const changedFields: string[] = [];

    if (
      input.projectName !== undefined &&
      input.projectName !== existingUnit.projectName
    ) {
      changedFields.push("projectName");
    }

    if (
      input.unitNumber !== undefined &&
      input.unitNumber !== existingUnit.unitNumber
    ) {
      changedFields.push("unitNumber");
    }

    if (
      input.type !== undefined &&
      input.type !== existingUnit.type
    ) {
      changedFields.push("type");
    }

    if (
      input.area !== undefined &&
      !existingUnit.area.equals(new Prisma.Decimal(input.area))
    ) {
      changedFields.push("area");
    }

    if (
      input.rooms !== undefined &&
      input.rooms !== existingUnit.rooms
    ) {
      changedFields.push("rooms");
    }

    const updateResult = await tx.unit.updateMany({
      where: {
        id: unitId,
        companyId,
        ...(priceChanged && {
          status: "AVAILABLE",
          price: existingUnit.price,
        }),
      },
      data,
    });

    if (updateResult.count === 0) {
      const currentUnit = await tx.unit.findFirst({
        where: {
          id: unitId,
          companyId,
        },
      });

      if (!currentUnit) {
        throw new ApiError(
          404,
          "UNIT_NOT_FOUND",
          "Unit not found.",
        );
      }

      throw new ApiError(
        409,
        "UNIT_UPDATE_CONFLICT",
        "Unit was modified by another request. Please refresh and try again.",
      );
    }

    if (changedFields.length > 0) {
      await createAuditLog(tx, {
        companyId,
        actorId,
        action: "UNIT_UPDATED",
        entityType: "Unit",
        entityId: unitId,
        ipAddress,
        metadata: {
          changedFields,
        },
      });
    }

    if (priceChanged && newPrice !== undefined) {
      await createAuditLog(tx, {
        companyId,
        actorId,
        action: "UNIT_PRICE_CHANGED",
        entityType: "Unit",
        entityId: unitId,
        ipAddress,
        metadata: {
          oldPrice: existingUnit.price.toString(),
          newPrice: newPrice.toString(),
        },
      });
    }

    const updatedUnit = await tx.unit.findFirst({
      where: {
        id: unitId,
        companyId,
      },
    });

    if (!updatedUnit) {
      throw new ApiError(
        404,
        "UNIT_NOT_FOUND",
        "Unit not found.",
      );
    }

    return updatedUnit;
  });
}

// ----------------------------------------
// DELETE: Delete unit
// ----------------------------------------

export async function deleteCompanyUnit(
  companyId: string,
  unitId: string,
  actorId: string,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    const existingUnit = await tx.unit.findFirst({
      where: {
        id: unitId,
        companyId,
      },
    });

    if (!existingUnit) {
      throw new ApiError(
        404,
        "UNIT_NOT_FOUND",
        "Unit not found.",
      );
    }

    if (existingUnit.status !== "AVAILABLE") {
      throw new ApiError(
        409,
        "UNIT_DELETE_NOT_ALLOWED",
        "Only available units can be deleted.",
      );
    }

    const reservationCount = await tx.reservation.count({
      where: {
        unitId,
        companyId,
      },
    });

    if (reservationCount > 0) {
      throw new ApiError(
        409,
        "UNIT_HAS_RESERVATIONS",
        "Units with reservation history cannot be deleted.",
      );
    }

    await tx.unit.delete({
      where: {
        id: unitId,
        companyId,
      },
    });

    await createAuditLog(tx, {
      companyId,
      actorId,
      action: "UNIT_DELETED",
      entityType: "Unit",
      entityId: unitId,
      ipAddress,
      metadata: {
        projectName: existingUnit.projectName,
        unitNumber: existingUnit.unitNumber,
        type: existingUnit.type,
        area: existingUnit.area.toString(),
        rooms: existingUnit.rooms,
        price: existingUnit.price.toString(),
        status: existingUnit.status,
      },
    });

    return { id: unitId };
  });
}
