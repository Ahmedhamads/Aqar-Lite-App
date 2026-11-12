
import { z } from "zod";

export const reservationIdSchema = z.object({
  id: z.string().uuid("Invalid reservation ID."),
});

export const createReservationSchema = z.object({
  unitId: z.string().uuid("Invalid unit ID."),
  clientId: z.string().uuid("Invalid client ID."),
});

export const reservationListQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .default(1),

  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .default(10),

  status: z
    .enum(["ACTIVE", "EXPIRED", "CONVERTED"])
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type CreateReservationInput =
  z.infer<typeof createReservationSchema>;

export type ReservationIdParams =
  z.infer<typeof reservationIdSchema>;

export type ReservationListQuery =
  z.infer<typeof reservationListQuerySchema>;
