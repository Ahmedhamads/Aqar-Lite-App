
import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name must contain at least 2 characters.")
    .max(150, "Company name cannot exceed 150 characters."),
});

export type UpdateCompanyInput = z.infer<
  typeof updateCompanySchema
>;
