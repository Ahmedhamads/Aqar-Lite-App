import { apiClient } from "@/lib/api/client";

import type {
  CreateReservationInput,
  Reservation,
  ReservationFilters,
  ReservationsResponse,
} from "@/types/reservation.types";

function buildQueryString(
  filters: ReservationFilters = {},
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

export const reservationService = {
  getAll(
    filters: ReservationFilters = {},
  ): Promise<ReservationsResponse> {
    return apiClient.get<ReservationsResponse>(
      `/reservations${buildQueryString(filters)}`,
    );
  },

  getById(id: string): Promise<Reservation> {
    return apiClient.get<Reservation>(
      `/reservations/${id}`,
    );
  },

  create(
    data: CreateReservationInput,
  ): Promise<Reservation> {
    return apiClient.post<Reservation>(
      "/reservations",
      data,
    );
  },
};