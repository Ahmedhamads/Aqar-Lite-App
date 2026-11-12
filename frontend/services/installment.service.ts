import { apiClient } from "@/lib/api/client";

import type {
  InstallmentFilters,
  InstallmentsResponse,
} from "@/types/installment.types";

function buildQueryString(
  filters: InstallmentFilters = {},
): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const installmentService = {
  getByContract(
    contractId: string,
    filters: InstallmentFilters = {},
  ): Promise<InstallmentsResponse> {
    return apiClient.get<InstallmentsResponse>(
      `/contracts/${contractId}/installments${buildQueryString(filters)}`,
    );
  },
};