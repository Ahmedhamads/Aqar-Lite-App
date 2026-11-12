
import { apiClient } from "@/lib/api/client";

import type {
  Company,
  UpdateCompanyInput,
} from "@/types/company.types";

export const companyService = {
  getCurrent(): Promise<Company> {
    return apiClient.get<Company>("/companies/me");
  },

  updateCurrent(data: UpdateCompanyInput): Promise<Company> {
    return apiClient.patch<Company>("/companies/me", data);
  },
};
