
export type UserRole = "MANAGER" | "ACCOUNTANT" | "SALES";

export interface CompanyUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: Exclude<UserRole, "MANAGER">;
  sortOrder?: "asc" | "desc";
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface UsersResponse {
  data: CompanyUser[];
  pagination: UserPagination;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, "MANAGER">;
}

export interface UpdateUserInput {
  name?: string;
  role?: Exclude<UserRole, "MANAGER">;
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}
