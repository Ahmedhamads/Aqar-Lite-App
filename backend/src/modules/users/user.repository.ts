
import type {
  Prisma,
  UserRole,
} from "../../generated/prisma/client";

import { prisma } from "../../config/database";

interface CreateUserInput {
  companyId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

interface FindUsersInput {
  companyId: string;
  role?: UserRole;
  skip: number;
  take: number;
  sortOrder: "asc" | "desc";
}

interface UpdateUserInput {
  companyId: string;
  userId: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

const publicUserSelect = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export async function createCompanyUser(
  tx: Prisma.TransactionClient,
  input: CreateUserInput,
) {
  return tx.user.create({
    data: input,
    select: publicUserSelect,
  });
}

export async function findCompanyUsers(input: FindUsersInput) {
  return prisma.user.findMany({
    where: {
      companyId: input.companyId,
      ...(input.role !== undefined && { role: input.role }),
    },
    select: publicUserSelect,
    orderBy: {
      createdAt: input.sortOrder,
    },
    skip: input.skip,
    take: input.take,
  });
}

export async function countCompanyUsers(
  companyId: string,
  role?: UserRole,
) {
  return prisma.user.count({
    where: {
      companyId,
      ...(role !== undefined && { role }),
    },
  });
}

export async function findCompanyUserById(
  companyId: string,
  userId: string,
) {
  return prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
    },
    select: publicUserSelect,
  });
}

export async function updateCompanyUser(
  tx: Prisma.TransactionClient,
  input: UpdateUserInput,
) {
  const result = await tx.user.updateMany({
    where: {
      id: input.userId,
      companyId: input.companyId,
    },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.role !== undefined && { role: input.role }),
      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return tx.user.findFirst({
    where: {
      id: input.userId,
      companyId: input.companyId,
    },
    select: publicUserSelect,
  });
}
