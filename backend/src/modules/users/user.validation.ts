
import { z } from "zod";

const userRoleSchema = z.enum([
  "ACCOUNTANT",
  "SALES",
]);

const userNameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(100);

const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address.")
  .max(254)
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128);

export const createUserSchema = z.object({
  name: userNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema,
});

export const updateUserSchema = z.object({
  name: userNameSchema.optional(),
  role: userRoleSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided.",
);

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: userRoleSchema.optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserStatusInput = z.infer<
  typeof updateUserStatusSchema
>;
