
import type { ReservationStatus } from "../../generated/prisma/client";
import { prisma } from "../../config/database";
import type { ReservationListQuery } from "./reservation.validation";

interface FindReservationsInput {
  companyId: string;
  salesRepId?: string;
  status?: ReservationStatus;
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export async function findReservationsByCompany(
  input: FindReservationsInput,
) {
  return prisma.reservation.findMany({
    where: {
      companyId: input.companyId,
      ...(input.salesRepId && {
        salesRepId: input.salesRepId,
      }),
      ...(input.status && {
        status: input.status,
      }),
    },
    include: {
      unit: {
        select: {
          id: true,
          projectName: true,
          unitNumber: true,
          type: true,
          area: true,
          price: true,
          status: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      salesRep: {
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
    skip: (input.page - 1) * input.limit,
    take: input.limit,
  });
}

export async function countReservationsByCompany(
  input: Omit<FindReservationsInput, "page" | "limit" | "sortOrder">,
) {
  return prisma.reservation.count({
    where: {
      companyId: input.companyId,
      ...(input.salesRepId && {
        salesRepId: input.salesRepId,
      }),
      ...(input.status && {
        status: input.status,
      }),
    },
  });
}

export async function findReservationById(
  companyId: string,
  reservationId: string,
  salesRepId?: string,
) {
  return prisma.reservation.findFirst({
    where: {
      id: reservationId,
      companyId,
      ...(salesRepId && {
        salesRepId,
      }),
    },
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
      contract: true,
    },
  });
}
