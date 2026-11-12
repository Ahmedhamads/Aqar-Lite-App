
export interface Client {
  id: string;
  companyId: string;
  salesRepId: string;
  name: string;
  phone: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "asc" | "desc";
}

export interface ClientPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ClientsResponse {
  items: Client[];
  pagination: ClientPagination;
}

export interface CreateClientInput {
  name: string;
  phone: string;
  notes?: string;
}

export interface UpdateClientInput {
  name?: string;
  phone?: string;
  notes?: string | null;
}
