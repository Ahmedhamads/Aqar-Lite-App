
import { apiClient } from "@/lib/api/client";

import type {
  Client,
  ClientFilters,
  ClientsResponse,
  CreateClientInput,
  UpdateClientInput,
} from "@/types/client.types";

function buildQueryString(filters: ClientFilters = {}): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const clientService = {
  getAll(filters: ClientFilters = {}): Promise<ClientsResponse> {
    return apiClient.get<ClientsResponse>(
      `/clients${buildQueryString(filters)}`,
    );
  },

  getById(id: string): Promise<Client> {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  create(data: CreateClientInput): Promise<Client> {
    return apiClient.post<Client>("/clients", data);
  },

  update(id: string, data: UpdateClientInput): Promise<Client> {
    return apiClient.patch<Client>(`/clients/${id}`, data);
  },
  delete(id: string): Promise<{
  id: string;
  deleted: boolean;
}> {
  return apiClient.delete<{
    id: string;
    deleted: boolean;
  }>(`/clients/${id}`);
},
};
