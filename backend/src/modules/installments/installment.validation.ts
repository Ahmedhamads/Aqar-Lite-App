
import { z } from "zod";

export const installmentContractParamsSchema = z.object({
  contractId: z.string().uuid(),
});

export const installmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
  ]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type InstallmentListQuery = z.infer<
  typeof installmentListQuerySchema
>;
