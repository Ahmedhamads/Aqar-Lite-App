
import { z } from "zod";

// ----------------------------------------
// MONEY VALIDATION
// ----------------------------------------

const moneyRegex =
  /^(0|[1-9]\d{0,11})(\.\d{1,2})?$/;

const positiveMoneySchema = z
  .string()
  .trim()
  .regex(
    moneyRegex,
    "Amount must be a valid decimal with up to 2 decimal places.",
  )
  .refine(
    (value) => {
      const [integerPart, decimalPart = ""] =
        value.split(".");

      const cents =
        BigInt(integerPart!) * 100n +
        BigInt(decimalPart.padEnd(2, "0"));

      return cents > 0n;
    },
    "Amount must be greater than zero.",
  );

const nonNegativeMoneySchema = z
  .string()
  .trim()
  .regex(
    moneyRegex,
    "Amount must be a valid decimal with up to 2 decimal places.",
  );

// ----------------------------------------
// DATE VALIDATION
// ----------------------------------------

const dateOnlySchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format.",
  )
  .refine(
    (value) => {
      const [year, month, day] = value
        .split("-")
        .map(Number);

      const date = new Date(
        Date.UTC(year!, month! - 1, day!),
      );

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month! - 1 &&
        date.getUTCDate() === day
      );
    },
    "Invalid calendar date.",
  );

// ----------------------------------------
// CONTRACT ID VALIDATION
// ----------------------------------------

export const contractIdSchema = z.object({
  id: z.string().uuid("Invalid contract ID."),
});

// ----------------------------------------
// CREATE CONTRACT DRAFT
// ----------------------------------------

export const createContractSchema = z
  .object({
    reservationId: z
      .string()
      .uuid("Invalid reservation ID."),

    finalPrice: positiveMoneySchema,

    downPayment: nonNegativeMoneySchema,

    installmentsCount: z
      .number()
      .int("Installments count must be an integer.")
      .min(1, "At least one installment is required.")
      .max(360, "Installments count cannot exceed 360."),

    startDate: dateOnlySchema,
  })
  .refine(
    (data) => {
      const [finalInteger, finalDecimal = ""] =
        data.finalPrice.split(".");

      const [downInteger, downDecimal = ""] =
        data.downPayment.split(".");

      const finalCents =
        BigInt(finalInteger!) * 100n +
        BigInt(finalDecimal.padEnd(2, "0"));

      const downCents =
        BigInt(downInteger!) * 100n +
        BigInt(downDecimal.padEnd(2, "0"));

      return downCents < finalCents;
    },
    {
      message: "Down payment must be less than final price.",
      path: ["downPayment"],
    },
  );

// ----------------------------------------
// CONTRACT LIST QUERY
// ----------------------------------------

export const contractListQuerySchema = z.object({
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

  status: z
    .enum(["DRAFT", "APPROVED"])
    .optional(),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
});

// ----------------------------------------
// TYPES
// ----------------------------------------

export type CreateContractInput = z.infer<
  typeof createContractSchema
>;

export type ContractIdParams = z.infer<
  typeof contractIdSchema
>;

export type ContractListQuery = z.infer<
  typeof contractListQuerySchema
>;
