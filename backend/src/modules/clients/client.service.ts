
import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  countClientsBySalesRep,
  findClientById,
  findClientsBySalesRep,
  deleteClient
} from "./client.repository";

import type {
  ClientListQuery,
  CreateClientInput,
  UpdateClientInput,
  
} from "./client.validation";

// ----------------------------------------
// CREATE: Create client
// ----------------------------------------

export async function createCompanyClient(
  companyId: string,
  salesRepId: string,
  input: CreateClientInput,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
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

    await createAuditLog(tx, {
      companyId,
      actorId: salesRepId,
      action: "CLIENT_CREATED",
      entityType: "Client",
      entityId: client.id,
      ipAddress,
      metadata: {
        name: client.name,
        phone: client.phone,
      },
    });

    return client;
  });
}

// ----------------------------------------
// READ: List sales rep clients
// ----------------------------------------

export async function getCompanyClients(
  companyId: string,
  salesRepId: string,
  query: ClientListQuery,
) {
  const filters = {
    companyId,
    salesRepId,
    ...(query.search && {
      search: query.search,
    }),
  };

  const [items, total] = await Promise.all([
    findClientsBySalesRep({
      ...filters,
      page: query.page,
      limit: query.limit,
      sortOrder: query.sortOrder,
    }),

    countClientsBySalesRep(filters),
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
// READ: Get one sales rep client
// ----------------------------------------

export async function getCompanyClientById(
  companyId: string,
  salesRepId: string,
  clientId: string,
) {
  const client = await findClientById(
    companyId,
    salesRepId,
    clientId,
  );

  if (!client) {
    throw new ApiError(
      404,
      "CLIENT_NOT_FOUND",
      "Client not found.",
    );
  }

  return client;
}

// ----------------------------------------
// UPDATE: Update client
// ----------------------------------------

export async function updateCompanyClient(
  companyId: string,
  salesRepId: string,
  clientId: string,
  input: UpdateClientInput,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({
      where: {
        id: clientId,
        companyId,
        salesRepId,
      },
    });

    if (!existingClient) {
      throw new ApiError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found.",
      );
    }

    const changedFields: string[] = [];

    if (
      input.name !== undefined &&
      input.name !== existingClient.name
    ) {
      changedFields.push("name");
    }

    if (
      input.phone !== undefined &&
      input.phone !== existingClient.phone
    ) {
      changedFields.push("phone");
    }

    if (
      input.notes !== undefined &&
      input.notes !== existingClient.notes
    ) {
      changedFields.push("notes");
    }

    const updateResult = await tx.client.updateMany({
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

    if (updateResult.count === 0) {
      throw new ApiError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found.",
      );
    }

    if (changedFields.length > 0) {
      await createAuditLog(tx, {
        companyId,
        actorId: salesRepId,
        action: "CLIENT_UPDATED",
        entityType: "Client",
        entityId: clientId,
        ipAddress,
        metadata: {
          changedFields,
        },
      });
    }

    const updatedClient = await tx.client.findFirst({
      where: {
        id: clientId,
        companyId,
        salesRepId,
      },
    });

    if (!updatedClient) {
      throw new ApiError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found.",
      );
    }

    return updatedClient;
  });
}

export async function deleteCompanyClient(
  companyId: string,
  salesRepId: string,
  clientId: string,
  ipAddress: string | null = null,
) {
  return prisma.$transaction(async (tx) => {
    const existingClient = await tx.client.findFirst({
      where: {
        id: clientId,
        companyId,
        salesRepId,
      },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!existingClient) {
      throw new ApiError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found.",
      );
    }

    if (existingClient._count.reservations > 0) {
      throw new ApiError(
        409,
        "CLIENT_HAS_RESERVATIONS",
        "Cannot delete a client with reservation history.",
      );
    }

    const deleteResult = await tx.client.deleteMany({
      where: {
        id: clientId,
        companyId,
        salesRepId,
      },
    });

    if (deleteResult.count === 0) {
      throw new ApiError(
        404,
        "CLIENT_NOT_FOUND",
        "Client not found.",
      );
    }

    await createAuditLog(tx, {
      companyId,
      actorId: salesRepId,
      action: "CLIENT_DELETED",
      entityType: "Client",
      entityId: clientId,
      ipAddress,
      metadata: {
        name: existingClient.name,
        phone: existingClient.phone,
      },
    });

    return {
      id: clientId,
      deleted: true,
    };
  });
}
