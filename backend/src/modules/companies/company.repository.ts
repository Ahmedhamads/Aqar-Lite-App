
import { prisma } from "../../config/database";

interface UpdateCompanyRepositoryInput {
  companyId: string;
  name: string;
}

export async function findCompanyById(companyId: string) {
  return prisma.company.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateCompany(
  input: UpdateCompanyRepositoryInput,
) {
  return prisma.company.updateMany({
    where: {
      id: input.companyId,
    },
    data: {
      name: input.name,
    },
  });
}
