
import { z } from "zod";

export const clientIdSchema = z.object({
  id: z.string().uuid("Invalid client ID."),
});

export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Client name must contain at least 2 characters.")
    .max(150, "Client name is too long."),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is too short.")
    .max(20, "Phone number is too long."),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters.")
    .optional(),
});

export const updateClientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .optional(),

    notes: z
      .string()
      .trim()
      .max(2000)
      .nullable()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided.",
  );

export const clientListQuerySchema = z.object({
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

  search: z.string().trim().max(100).optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

export type CreateClientInput =
  z.infer<typeof createClientSchema>;

export type UpdateClientInput =
  z.infer<typeof updateClientSchema>;

export type ClientListQuery =
  z.infer<typeof clientListQuerySchema>;
