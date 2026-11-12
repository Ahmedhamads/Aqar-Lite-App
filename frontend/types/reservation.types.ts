export type ReservationStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "CONVERTED";

export interface ReservationUnit {
  id: string;
  projectName: string;
  unitNumber: string;
  type: string;
  area: string;
  price: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";

  // Available in the create and details responses
  companyId?: string;
  rooms?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationClient {
  id: string;
  name: string;
  phone: string;

  // Available in the full client response
  companyId?: string;
  salesRepId?: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationSalesRep {
  id: string;
  name: string;
  email: string;
}

export interface Reservation {
  id: string;
  companyId: string;
  unitId: string;
  clientId: string;
  salesRepId: string;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;

  unit: ReservationUnit;
  client: ReservationClient;
  salesRep?: ReservationSalesRep;
}

export interface ReservationFilters {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
  sortOrder?: "asc" | "desc";
}

export interface ReservationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReservationsResponse {
  items: Reservation[];
  pagination: ReservationPagination;
}

export interface CreateReservationInput {
  unitId: string;
  clientId: string;
}