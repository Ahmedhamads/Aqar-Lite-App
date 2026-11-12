
import { apiClient } from "@/lib/api/client";

import type {
  Contract,
  ContractFilters,
  ContractsResponse,
  CreateContractInput,
} from "@/types/contract.types";

function buildQueryString(
  filters: ContractFilters = {},
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

export const contractService = {
  getAll(
    filters: ContractFilters = {},
  ): Promise<ContractsResponse> {
    return apiClient.get<ContractsResponse>(
      `/contracts${buildQueryString(filters)}`,
    );
  },

  getById(id: string): Promise<Contract> {
    return apiClient.get<Contract>(`/contracts/${id}`);
  },

  create(data: CreateContractInput): Promise<Contract> {
    return apiClient.post<Contract>("/contracts", data);
  },

  approve(id: string): Promise<Contract> {
    return apiClient.post<Contract>(
      `/contracts/${id}/approve`,
      {},
    );
  },
};
