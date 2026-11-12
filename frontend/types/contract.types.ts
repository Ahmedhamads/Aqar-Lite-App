
export type ContractStatus = "DRAFT" | "APPROVED";

export type InstallmentStatus =
  | "PENDING"
  | "PARTIAL"
  | "PARTIALLY_PAID"
  | "PAID";

export interface ContractUnit {
  id: string;
  projectName: string;
  unitNumber: string;
  type: string;
  area: string;
  rooms: number;
  price: string;
  status: "AVAILABLE" | "RESERVED" | "SOLD";
}

export interface ContractClient {
  id: string;
  name: string;
  phone: string;
}

export interface ContractSalesRep {
  id: string;
  name: string;
}

export interface ContractReservation {
  id: string;
  status: "ACTIVE" | "EXPIRED" | "CONVERTED";
  expiresAt: string;
  createdAt: string;
  unit: ContractUnit;
  client: ContractClient;
  salesRep?: ContractSalesRep;
}

export interface ContractInstallment {
  id: string;
  companyId: string;
  contractId: string;
  sequence: number;
  amount: string;
  paidAmount: string;
  dueDate: string;
  status: InstallmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  companyId: string;
  reservationId: string;
  status: ContractStatus;
  unitPrice: string;
  finalPrice: string;
  downPayment: string;
  installmentsCount: number;
  startDate: string;
  approvedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reservation: ContractReservation;
  installments?: ContractInstallment[];
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  status?: ContractStatus;
  sortOrder?: "asc" | "desc";
}

export interface ContractPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ContractsResponse {
  items: Contract[];
  pagination: ContractPagination;
}

export interface CreateContractInput {
  reservationId: string;
  finalPrice: string;
  downPayment: string;
  installmentsCount: number;
  startDate: string;
}
