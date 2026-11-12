export type UnitStatus = "AVAILABLE" | "RESERVED" | "SOLD";


export interface Unit {
  id: string;
  companyId: string;
  projectName: string;
  unitNumber: string;
  type: string;
  area: string;
  rooms: number;
  price: string;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}
export interface UnitFilters {
  page?: number;
  limit?: number;
  status?: UnitStatus;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: "price" | "area";
  sortOrder?: "asc" | "desc";
}

export interface UnitPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface UnitsResponse {
  items: Unit[];
  pagination: UnitPagination;
}

export interface CreateUnitInput {
  projectName: string;
  unitNumber: string;
  type: string;
  area: string;
  rooms: number;
  price: string;
}

export type UpdateUnitInput = Partial<CreateUnitInput>;