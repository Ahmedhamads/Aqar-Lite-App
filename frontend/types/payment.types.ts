
export interface PaymentRecorder {
  id: string;
  name: string;
  email: string;
}

export interface PaymentClient {
  id: string;
  name: string;
  phone: string;
}

export interface PaymentUnit {
  id: string;
  projectName: string;
  unitNumber: string;
  type: string;
  area: string;
}

export interface PaymentReservation {
  id: string;
  client: PaymentClient;
  unit: PaymentUnit;
}

export interface PaymentContract {
  id: string;
  reservation: PaymentReservation;
}

export interface PaymentInstallment {
  id: string;
  sequence: number;
  amount: string;
  paidAmount: string;
  dueDate: string;
  status: "PENDING" | "PARTIALLY_PAID" | "PAID";
  contract: PaymentContract;
}

export interface PaymentAllocation {
  id: string;
  amount: string;
  installment: PaymentInstallment;
}

export interface Payment {
  id: string;
  companyId: string;
  recordedById: string;
  idempotencyKey: string;
  amount: string;
  createdAt: string;
  recordedBy: PaymentRecorder;
  allocations: PaymentAllocation[];
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaymentsResponse {
  items: Payment[];
  pagination: PaymentPagination;
}

export interface CreatePaymentInput {
  amount: string;
}
