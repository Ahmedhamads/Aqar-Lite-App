export type InstallmentStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE";

export interface Installment {
  id: string;
  sequence: number;
  amount: string;
  paidAmount: string;
  remainingAmount: string;
  dueDate: string;
  status: InstallmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentContract {
  id: string;
  finalPrice: string;
  downPayment: string;
}

export interface InstallmentSummary {
  installmentsCount: number;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
}

export interface InstallmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InstallmentsResponse {
  contract: InstallmentContract;
  summary: InstallmentSummary;
  installments: Installment[];
  pagination: InstallmentPagination;
}

export interface InstallmentFilters {
  page?: number;
  limit?: number;
  status?: InstallmentStatus;
  sortOrder?: "asc" | "desc";
}