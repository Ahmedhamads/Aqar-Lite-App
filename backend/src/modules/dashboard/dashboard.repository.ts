import type { UserRole } from "../../generated/prisma/client";
import { prisma } from "../../config/database";

interface DashboardQueryInput {
  companyId: string;
  userId: string;
  role: UserRole;
}

export async function getDashboardStatistics({
  companyId,
  userId,
  role,
}: DashboardQueryInput) {
  const isSales = role === "SALES";

  // Sales users only see their own clients, reservations,
  // contracts, and financial installment data.
  const salesReservationFilter = isSales
    ? {
        reservation: {
          is: {
            salesRepId: userId,
          },
        },
      }
    : {};

  const salesInstallmentFilter = isSales
    ? {
        contract: {
          is: {
            reservation: {
              is: {
                salesRepId: userId,
              },
            },
          },
        },
      }
    : {};

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [
    totalUnits,
    availableUnits,
    reservedUnits,
    soldUnits,
    totalClients,
    totalReservations,
    activeReservations,
    expiredReservations,
    convertedReservations,
    totalContracts,
    draftContracts,
    approvedContracts,
    installmentAggregate,
    recentActivity,
    overdueInstallments,
  ] = await Promise.all([
    prisma.unit.count({
      where: { companyId },
    }),

    prisma.unit.count({
      where: {
        companyId,
        status: "AVAILABLE",
      },
    }),

    prisma.unit.count({
      where: {
        companyId,
        status: "RESERVED",
      },
    }),

    prisma.unit.count({
      where: {
        companyId,
        status: "SOLD",
      },
    }),
    

    prisma.client.count({
      where: {
        companyId,
        ...(isSales ? { salesRepId: userId } : {}),
      },
    }),

    prisma.reservation.count({
      where: {
        companyId,
        ...(isSales ? { salesRepId: userId } : {}),
      },
    }),

    prisma.reservation.count({
      where: {
        companyId,
        status: "ACTIVE",
        expiresAt: {
          gt: new Date(),
        },
        ...(isSales ? { salesRepId: userId } : {}),
      },
    }),

    prisma.reservation.count({
      where: {
        companyId,
        status: "EXPIRED",
        ...(isSales ? { salesRepId: userId } : {}),
      },
    }),

    prisma.reservation.count({
      where: {
        companyId,
        status: "CONVERTED",
        ...(isSales ? { salesRepId: userId } : {}),
      },
    }),

    prisma.contract.count({
      where: {
        companyId,
        ...salesReservationFilter,
      },
    }),

    prisma.contract.count({
      where: {
        companyId,
        status: "DRAFT",
        ...salesReservationFilter,
      },
    }),

    prisma.contract.count({
      where: {
        companyId,
        status: "APPROVED",
        ...salesReservationFilter,
      },
    }),

    prisma.installment.aggregate({
      where: {
        companyId,
        contract: {
          is: {
            companyId,
            status: "APPROVED",
            ...(isSales
              ? {
                  reservation: {
                    is: {
                      salesRepId: userId,
                    },
                  },
                }
              : {}),
          },
        },
      },
      _sum: {
        amount: true,
        paidAmount: true,
      },
      _count: {
        id: true,
      },
    }),
    prisma.auditLog.findMany({
  where: {
    companyId,
    ...(role !== "MANAGER" ? { actorId: userId } : {}),
  },
  include: {
    actor: {
      select: {
        id: true,
        name: true,
        role: true,
      },
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 10,
}),

    prisma.installment.count({
      where: {
        companyId,
        dueDate: {
          lt: today,
        },
        status: {
          in: ["PENDING", "PARTIAL", "PARTIALLY_PAID"],
        },
        contract: {
          is: {
            companyId,
            status: "APPROVED",
            ...(isSales
              ? {
                  reservation: {
                    is: {
                      salesRepId: userId,
                    },
                  },
                }
              : {}),
          },
        },
      },
    }),
  ]);

  return {
    units: {
      total: totalUnits,
      available: availableUnits,
      reserved: reservedUnits,
      sold: soldUnits,
    },

    clients: {
      total: totalClients,
    },

    reservations: {
      total: totalReservations,
      active: activeReservations,
      expired: expiredReservations,
      converted: convertedReservations,
    },

    contracts: {
      total: totalContracts,
      draft: draftContracts,
      approved: approvedContracts,
    },

    installments: {
      total: installmentAggregate._count.id,
      overdue: overdueInstallments,
    },

    financials: {
      installmentAmount: Number(
        installmentAggregate._sum.amount ?? 0,
      ),
    
      collectedAmount: Number(
        installmentAggregate._sum.paidAmount ?? 0,
      ),

      remainingAmount:
        Number(installmentAggregate._sum.amount ?? 0) -
        Number(installmentAggregate._sum.paidAmount ?? 0),
    },
    recentActivity,
  };
}