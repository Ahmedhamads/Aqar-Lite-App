
import type { UserRole } from "../../generated/prisma/client";

export interface TenantContext {
  companyId: string;
  userId: string;
  role: UserRole;
}
