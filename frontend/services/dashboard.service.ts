import { apiClient } from "@/lib/api/client";
import type { DashboardSummary } from "@/types/dashboard.types";

export const dashboardService = {
  getSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>("/dashboard/summary");
  },
};