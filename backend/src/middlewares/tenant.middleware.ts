
import type { Request, Response, NextFunction } from "express";

import { ApiError } from "../shared/errors/api-error";
import type { TenantContext } from "../shared/tenant/tenant.types";

export function attachTenantContext(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const user = req.user;

  if (!user) {
    next(
      new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      ),
    );
    return;
  }

  const tenantContext: TenantContext = {
    companyId: user.companyId,
    userId: user.id,
    role: user.role,
  };

  req.tenant = tenantContext;

  next();
}

export function requireTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.tenant) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  next();
}