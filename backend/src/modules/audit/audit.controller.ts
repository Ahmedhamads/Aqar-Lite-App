
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import { getCompanyAuditLogs } from "./audit.service";

import type { AuditListQuery } from "./audit.validation";

export async function getAuditLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.tenant) {
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      );
    }

    const query =
      res.locals.validatedQuery as AuditListQuery;

    const result = await getCompanyAuditLogs({
      companyId: req.tenant.companyId,
      query,
    });

    sendSuccess(
      res,
      "Audit logs retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}
