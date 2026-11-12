
import { z } from "zod";

// Decimal(10, 2): 8 integer digits + 2 decimal digits
const areaSchema = z
  .string()
  .regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    "Area must have up to 8 integer digits and 2 decimal places.",
  )
  .refine((value) => Number(value) > 0, {
    message: "Area must be greater than zero.",
  });

// Decimal(14, 2): 12 integer digits + 2 decimal digits
const priceSchema = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Price must have up to 12 integer digits and 2 decimal places.",
  )
  .refine((value) => Number(value) > 0, {
    message: "Price must be greater than zero.",
  });

const unitFields = {
  projectName: z
    .string()
    .trim()
    .min(1, "Project name is required.")
    .max(150, "Project name is too long."),

  unitNumber: z
    .string()
    .trim()
    .min(1, "Unit number is required.")
    .max(50, "Unit number is too long."),

  type: z
    .string()
    .trim()
    .min(1, "Unit type is required.")
    .max(80, "Unit type is too long."),

  area: areaSchema,

  rooms: z
    .number()
    .int("Rooms must be an integer.")
    .min(0, "Rooms cannot be negative.")
    .max(100, "Rooms value is too large."),

  price: priceSchema,
};

// Create unit
export const createUnitSchema = z.object(unitFields);

// Update unit
export const updateUnitSchema = z
  .object(unitFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided.",
    },
  );

// Unit ID
export const unitIdSchema = z.object({
  id: z.string().uuid("Invalid unit ID."),
});

// List filters
const decimalPriceSchema = z
  .string()
  .regex(
    /^\d{1,12}(\.\d{1,2})?$/,
    "Price must be a valid decimal amount with up to 2 decimal places.",
  );

function toCents(value: string): bigint {
  const [whole = "0", fraction = ""] = value.split(".");

  return (
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, "0"))
  );
}

export const unitListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    status: z
      .enum(["AVAILABLE", "RESERVED", "SOLD"])
      .optional(),

    minPrice: decimalPriceSchema.optional(),

    maxPrice: decimalPriceSchema.optional(),

    sortBy: z.enum(["price", "area"]).default("price"),

    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  })
  .refine(
    (data) =>
      !data.minPrice ||
      !data.maxPrice ||
      toCents(data.minPrice) <= toCents(data.maxPrice),
    {
      message: "Minimum price cannot exceed maximum price.",
      path: ["minPrice"],
    },
  );

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitIdParams = z.infer<typeof unitIdSchema>;
export type UnitListQuery = z.infer<typeof unitListQuerySchema>;
