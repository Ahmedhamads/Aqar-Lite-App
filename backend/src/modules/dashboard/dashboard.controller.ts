import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/utils/api-response";

import { getDashboardSummary } from "./dashboard.service";

export async function getDashboardSummaryController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.tenant) {
      throw new ApiError(
        401,
        "TENANT_CONTEXT_MISSING",
        "Tenant context is required.",
      );
    }

    const result = await getDashboardSummary({
      companyId: req.tenant.companyId,
      userId: req.tenant.userId,
      role: req.tenant.role,
    });

    sendSuccess(
      res,
      result,
      "Dashboard summary retrieved successfully.",
    );
  } catch (error: unknown) {
    next(error);
  }
}