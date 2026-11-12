import { apiClient } from "@/lib/api/client";

import type {
  CreateUnitInput,
  Unit,
  UnitFilters,
  UnitsResponse,
  UpdateUnitInput,
} from "@/types/unit.types";

function buildQueryString(filters: UnitFilters = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const unitService = {
  getAll(filters: UnitFilters = {}): Promise<UnitsResponse> {
    return apiClient.get<UnitsResponse>(
      `/units${buildQueryString(filters)}`,
    );
  },

  getById(id: string): Promise<Unit> {
    return apiClient.get<Unit>(`/units/${id}`);
  },

  create(data: CreateUnitInput): Promise<Unit> {
    return apiClient.post<Unit>("/units", data);
  },

  update(id: string, data: UpdateUnitInput): Promise<Unit> {
    return apiClient.patch<Unit>(`/units/${id}`, data);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/units/${id}`);
  },
};