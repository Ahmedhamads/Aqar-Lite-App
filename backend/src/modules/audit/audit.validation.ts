
import { z } from "zod";

const validDate = z
  .string()
  .trim()
  .refine(
    (value) => !Number.isNaN(Date.parse(value)),
    "Invalid date format.",
  );

export const auditListQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    action: z.string().trim().min(1).max(100).optional(),

    entityType: z.string().trim().min(1).max(100).optional(),

    entityId: z.string().uuid().optional(),

    from: validDate.optional(),

    to: validDate.optional(),
    actorId: z.string().uuid().optional(),
  })
  .refine(
    (query) =>
      !query.from ||
      !query.to ||
      new Date(query.from) <= new Date(query.to),
    {
      message: "'from' must be earlier than or equal to 'to'.",
      path: ["from"],
    },
  );

export type AuditListQuery = z.infer<
  typeof auditListQuerySchema
>;
