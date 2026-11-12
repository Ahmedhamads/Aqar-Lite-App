
import { apiClient } from "@/lib/api/client";

import type {
  CompanyUser,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserStatusInput,
  UserFilters,
  UsersResponse,
} from "@/types/user.types";

function buildQueryString(
  filters: UserFilters = {},
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

export const userService = {
  getAll(
    filters: UserFilters = {},
  ): Promise<UsersResponse> {
    return apiClient.get<UsersResponse>(
      `/users${buildQueryString(filters)}`,
    );
  },

  getById(id: string): Promise<CompanyUser> {
    return apiClient.get<CompanyUser>(`/users/${id}`);
  },

  create(data: CreateUserInput): Promise<CompanyUser> {
    return apiClient.post<CompanyUser>("/users", data);
  },

  update(
    id: string,
    data: UpdateUserInput,
  ): Promise<CompanyUser> {
    return apiClient.patch<CompanyUser>(
      `/users/${id}`,
      data,
    );
  },

  updateStatus(
    id: string,
    data: UpdateUserStatusInput,
  ): Promise<CompanyUser> {
    return apiClient.patch<CompanyUser>(
      `/users/${id}/status`,
      data,
    );
  },
};
