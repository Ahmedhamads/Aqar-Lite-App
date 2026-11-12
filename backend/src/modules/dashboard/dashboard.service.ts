import type { UserRole } from "../../generated/prisma/client";

import { getDashboardStatistics } from "./dashboard.repository";

interface GetDashboardSummaryInput {
  companyId: string;
  userId: string;
  role: UserRole;
}

export async function getDashboardSummary(
  input: GetDashboardSummaryInput,
) {
  return getDashboardStatistics(input);
}