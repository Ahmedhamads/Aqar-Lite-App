
import { Prisma } from "../../generated/prisma/client";
import type { UnitStatus } from "../../generated/prisma/client";

import { prisma } from "../../config/database";

import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "./unit.validation";

// ----------------------------------------
// READ: Find units with filtering and sorting
// ----------------------------------------

interface FindUnitsInput {
  companyId: string;
  skip: number;
  take: number;
  status?: UnitStatus;
  minPrice?: string;
  maxPrice?: string;
  sortBy: "price" | "area";
  sortOrder: "asc" | "desc";
}

export function findUnitsByCompany(input: FindUnitsInput) {
  return prisma.unit.findMany({
    where: {
      companyId: input.companyId,

      ...(input.status !== undefined
        ? { status: input.status }
        : {}),

      ...(input.minPrice !== undefined || input.maxPrice !== undefined
        ? {
            price: {
              ...(input.minPrice !== undefined
                ? { gte: new Prisma.Decimal(input.minPrice) }
                : {}),
              ...(input.maxPrice !== undefined
                ? { lte: new Prisma.Decimal(input.maxPrice) }
                : {}),
            },
          }
        : {}),
    },

    orderBy:
      input.sortBy === "price"
        ? { price: input.sortOrder }
        : { area: input.sortOrder },

    skip: input.skip,
    take: input.take,
  });
}

// ----------------------------------------
// READ: Count filtered units
// ----------------------------------------

interface CountUnitsFilters {
  status?: UnitStatus;
  minPrice?: string;
  maxPrice?: string;
}

export function countUnitsByCompany(
  companyId: string,
  filters: CountUnitsFilters,
) {
  return prisma.unit.count({
    where: {
      companyId,

      ...(filters.status !== undefined
        ? { status: filters.status }
        : {}),

      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            price: {
              ...(filters.minPrice !== undefined
                ? { gte: new Prisma.Decimal(filters.minPrice) }
                : {}),
              ...(filters.maxPrice !== undefined
                ? { lte: new Prisma.Decimal(filters.maxPrice) }
                : {}),
            },
          }
        : {}),
    },
  });
}

// ----------------------------------------
// READ: Find one unit by ID and company
// ----------------------------------------

export function findUnitById(
  companyId: string,
  unitId: string,
) {
  return prisma.unit.findFirst({
    where: {
      id: unitId,
      companyId,
    },
  });
}

// ----------------------------------------
// CREATE: Create unit
// ----------------------------------------

export async function createUnit(
  companyId: string,
  input: CreateUnitInput,
) {
  return prisma.unit.create({
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
}

// ----------------------------------------
// UPDATE: Update unit
// ----------------------------------------

export async function updateUnit(
  companyId: string,
  unitId: string,
  input: UpdateUnitInput,
) {
  const data: Prisma.UnitUpdateManyMutationInput = {
    ...(input.projectName !== undefined
      ? { projectName: input.projectName }
      : {}),

    ...(input.unitNumber !== undefined
      ? { unitNumber: input.unitNumber }
      : {}),

    ...(input.type !== undefined
      ? { type: input.type }
      : {}),

    ...(input.area !== undefined
      ? { area: new Prisma.Decimal(input.area) }
      : {}),

    ...(input.rooms !== undefined
      ? { rooms: input.rooms }
      : {}),

    ...(input.price !== undefined
      ? { price: new Prisma.Decimal(input.price) }
      : {}),
  };

  const result = await prisma.unit.updateMany({
    where: {
      id: unitId,
      companyId,
    },
    data,
  });

  if (result.count === 0) {
    return null;
  }

  return findUnitById(companyId, unitId);
}

// ----------------------------------------
// DELETE: Delete unit
// ----------------------------------------

export function deleteUnit(
  companyId: string,
  unitId: string,
) {
  return prisma.unit.deleteMany({
    where: {
      id: unitId,
      companyId,
    },
  });
}
