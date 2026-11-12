
import { z } from "zod";

const positiveMoneySchema = z
  .string()
  .regex(
    /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/,
    "Amount must be a valid monetary value with up to 2 decimal places.",
  )
  .refine((value) => {
    const [integerPart, decimalPart = ""] = value.split(".");
    const cents =
      BigInt(integerPart!) * 100n +
      BigInt(decimalPart.padEnd(2, "0"));

    return cents > 0n;
  }, "Amount must be greater than zero.");

export const contractIdParamsSchema = z.object({
  contractId: z.string().uuid(),
});

export const createPaymentSchema = z.object({
  amount: positiveMoneySchema,
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(
    /^[a-zA-Z0-9._:-]+$/,
    "Invalid idempotency key format.",
  );

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;

export type ContractIdParams = z.infer<
  typeof contractIdParamsSchema
>;

export type PaymentListQuery = z.infer<
  typeof paymentListQuerySchema
>;
