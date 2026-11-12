
import { apiClient } from "@/lib/api/client";

import type {
  CreatePaymentInput,
  Payment,
  PaymentFilters,
  PaymentsResponse,
} from "@/types/payment.types";

function buildQueryString(
  filters: PaymentFilters = {},
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

export const paymentService = {
  getAll(
    filters: PaymentFilters = {},
  ): Promise<PaymentsResponse> {
    return apiClient.get<PaymentsResponse>(
      `/payment${buildQueryString(filters)}`,
    );
  },

  create(
    contractId: string,
    data: CreatePaymentInput,
    idempotencyKey: string,
  ): Promise<Payment> {
    return apiClient.post<Payment>(
      `/payment/contracts/${contractId}/payments`,
      data,
      {
        headers: {
          "Idempotency-Key": idempotencyKey,
        },
      },
    );
  },
};
