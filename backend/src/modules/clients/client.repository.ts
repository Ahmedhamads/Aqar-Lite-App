
import { prisma } from "../../config/database";
import type {
  CreateClientInput,
  UpdateClientInput,
} from "./client.validation";

interface FindClientsInput {
  companyId: string;
  salesRepId: string;
  search?: string;
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}


export async function createClient(
  companyId: string,
  salesRepId: string,
  input: CreateClientInput,
) {
  return prisma.client.create({
    data: {
      companyId,
      salesRepId,
      name: input.name,
      phone: input.phone,
      ...(input.notes !== undefined && {
        notes: input.notes,
      }),
    },
  });
}

export async function findClientsBySalesRep(
  input: FindClientsInput,
) {
  return prisma.client.findMany({
    where: {
      companyId: input.companyId,
      salesRepId: input.salesRepId,
      ...(input.search && {
        OR: [
          {
            name: {
              contains: input.search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: input.search,
            },
          },
        ],
      }),
    },
    orderBy: {
      createdAt: input.sortOrder,
    },
    skip: (input.page - 1) * input.limit,
    take: input.limit,
  });
}

export async function countClientsBySalesRep(
  input: Omit<
    FindClientsInput,
    "page" | "limit" | "sortOrder"
  >,
) {
  return prisma.client.count({
    where: {
      companyId: input.companyId,
      salesRepId: input.salesRepId,
      ...(input.search && {
        OR: [
          {
            name: {
              contains: input.search,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: input.search,
            },
          },
        ],
      }),
    },
  });
}

export async function findClientById(
  companyId: string,
  salesRepId: string,
  clientId: string,
) {
  return prisma.client.findFirst({
    where: {
      id: clientId,
      companyId,
      salesRepId,
    },
  });
}

export async function updateClient(
  companyId: string,
  salesRepId: string,
  clientId: string,
  input: UpdateClientInput,
) {
  return prisma.client.updateMany({
    where: {
      id: clientId,
      companyId,
      salesRepId,
    },
    data: {
      ...(input.name !== undefined && {
        name: input.name,
      }),
      ...(input.phone !== undefined && {
        phone: input.phone,
      }),
      ...(input.notes !== undefined && {
        notes: input.notes,
      }),
    },
  });
}


export async function deleteClient(
  companyId: string,
  salesRepId: string,
  clientId: string,
) {
  return prisma.client.deleteMany({
    where: {
      id: clientId,
      companyId,
      salesRepId,
    },
  });
}
