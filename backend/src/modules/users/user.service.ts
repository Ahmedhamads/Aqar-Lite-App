
import argon2 from "argon2";
import { Prisma } from "../../generated/prisma/client";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";
import { createAuditLog } from "../../shared/audit/audit.service";

import {
  createCompanyUser,
  countCompanyUsers,
  findCompanyUserById,
  findCompanyUsers,
  updateCompanyUser,
} from "./user.repository";

import type {
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
} from "./user.validation";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

function userNotFoundError(): ApiError {
  return new ApiError(
    404,
    "USER_NOT_FOUND",
    "User not found.",
  );
}

/**
 * Serializes administrative role/status changes for a company.
 * PostgreSQL row locking prevents concurrent requests from
 * deactivating or demoting multiple managers simultaneously.
 */
async function lockCompanyForUserAdministration(
  tx: Prisma.TransactionClient,
  companyId: string,
): Promise<void> {
  await tx.$queryRaw`
    SELECT "id"
    FROM "Company"
    WHERE "id" = ${companyId}::uuid
    FOR UPDATE
  `;
}

/**
 * Prevents removing the last active manager from a company.
 * Call this after locking the company row.
 */
async function ensureAnotherActiveManagerExists(
  tx: Prisma.TransactionClient,
  companyId: string,
  excludedUserId: string,
): Promise<void> {
  const remainingManagers = await tx.user.count({
    where: {
      companyId,
      role: "MANAGER",
      isActive: true,
      id: {
        not: excludedUserId,
      },
    },
  });

  if (remainingManagers === 0) {
    throw new ApiError(
      409,
      "LAST_ACTIVE_MANAGER",
      "You cannot remove or deactivate the last active manager.",
    );
  }
}

// ----------------------------------------
// CREATE USER
// ----------------------------------------

export async function createCompanyUserService(
  companyId: string,
  actorId: string,
  input: CreateUserInput,
  ipAddress?: string,
) {
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const user = await createCompanyUser(tx, {
        companyId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      });

      await createAuditLog(tx, {
        companyId,
        actorId,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: user.id,
        metadata: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        ...(ipAddress !== undefined && { ipAddress }),
      });

      return user;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ApiError(
        409,
        "USER_EMAIL_ALREADY_EXISTS",
        "A user with this email already exists.",
      );
    }

    throw error;
  }
}

// ----------------------------------------
// GET USERS
// ----------------------------------------

export async function getCompanyUsersService(
  companyId: string,
  query: UserListQuery,
) {
  const skip = calculateSkip(query.page, query.limit);

  const [users, total] = await Promise.all([
    findCompanyUsers({
      companyId,
      ...(query.role !== undefined && { role: query.role }),
      skip,
      take: query.limit,
      sortOrder: query.sortOrder,
    }),
    countCompanyUsers(companyId, query.role),
  ]);

  return {
    data: users,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// ----------------------------------------
// GET USER BY ID
// ----------------------------------------

export async function getCompanyUserByIdService(
  companyId: string,
  userId: string,
) {
  const user = await findCompanyUserById(companyId, userId);

  if (!user) {
    throw userNotFoundError();
  }

  return user;
}

// ----------------------------------------
// UPDATE USER
// ----------------------------------------

export async function updateCompanyUserService(
  companyId: string,
  actorId: string,
  userId: string,
  input: UpdateUserInput,
  ipAddress?: string,
) {
  return prisma.$transaction(async (tx) => {
    await lockCompanyForUserAdministration(tx, companyId);

    const existingUser = await tx.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw userNotFoundError();
    }

    const isDemotingActiveManager =
  existingUser.role === "MANAGER" &&
  existingUser.isActive &&
  input.role !== undefined;

    if (isDemotingActiveManager) {
      await ensureAnotherActiveManagerExists(
        tx,
        companyId,
        userId,
      );
    }

    const updatedUser = await updateCompanyUser(tx, {
      companyId,
      userId,
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
    });

    if (!updatedUser) {
      throw userNotFoundError();
    }

    const changedFields: string[] = [];

    if (input.name !== undefined && input.name !== existingUser.name) {
      changedFields.push("name");
    }

    if (input.role !== undefined && input.role !== existingUser.role) {
      changedFields.push("role");
    }

    if (changedFields.length > 0) {
      await createAuditLog(tx, {
        companyId,
        actorId,
        action: "USER_UPDATED",
        entityType: "USER",
        entityId: userId,
        metadata: {
          changedFields,
          previous: {
            name: existingUser.name,
            role: existingUser.role,
          },
          current: {
            name: updatedUser.name,
            role: updatedUser.role,
          },
        },
        ...(ipAddress !== undefined && { ipAddress }),
      });
    }

    return updatedUser;
  });
}

// ----------------------------------------
// UPDATE USER ACTIVE STATUS
// ----------------------------------------

export async function setCompanyUserActiveStatusService(
  companyId: string,
  actorId: string,
  userId: string,
  isActive: boolean,
  ipAddress?: string,
) {
  if (actorId === userId && !isActive) {
    throw new ApiError(
      400,
      "SELF_DEACTIVATION_NOT_ALLOWED",
      "You cannot deactivate your own account.",
    );
  }

  return prisma.$transaction(async (tx) => {
    await lockCompanyForUserAdministration(tx, companyId);

    const existingUser = await tx.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw userNotFoundError();
    }

    const isDeactivatingActiveManager =
      existingUser.role === "MANAGER" &&
      existingUser.isActive &&
      !isActive;

    if (isDeactivatingActiveManager) {
      await ensureAnotherActiveManagerExists(
        tx,
        companyId,
        userId,
      );
    }

    const updatedUser = await updateCompanyUser(tx, {
      companyId,
      userId,
      isActive,
    });

    if (!updatedUser) {
      throw userNotFoundError();
    }

    // Revoke outstanding sessions when the account is inactive.
    // This is done even if the account was already inactive.
    if (!isActive) {
      await tx.session.updateMany({
        where: {
          userId,
          companyId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    // No audit entry is needed when the status did not change.
    if (existingUser.isActive !== isActive) {
      await createAuditLog(tx, {
        companyId,
        actorId,
        action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entityType: "USER",
        entityId: userId,
        metadata: {
          previousIsActive: existingUser.isActive,
          currentIsActive: isActive,
        },
        ...(ipAddress !== undefined && { ipAddress }),
      });
    }

    return updatedUser;
  });
}
