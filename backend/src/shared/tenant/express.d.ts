
import type { TenantContext } from "./tenant.types";

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
    }
  }
}

export {};
