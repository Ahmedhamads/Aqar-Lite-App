
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import {
  getCurrentCompany,
  updateCurrentCompany,
} from "./company.service";

import type { UpdateCompanyInput } from "./company.validation";

// ----------------------------------------
// GET CURRENT COMPANY
// ----------------------------------------

export async function getCurrentCompanyController(
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

    const company = await getCurrentCompany(
      req.tenant.companyId,
    );

    sendSuccess(
      res,
      "Company retrieved successfully.",
      company,
    );
  } catch (error: unknown) {
    next(error);
  }
}

// ----------------------------------------
// UPDATE CURRENT COMPANY
// ----------------------------------------

export async function updateCurrentCompanyController(
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

    const input = res.locals.validatedBody as UpdateCompanyInput;

    const company = await updateCurrentCompany(
      req.tenant.companyId,
      req.tenant.userId,
      input.name,
      req.ip ?? null,
    );

    sendSuccess(
      res,
      "Company updated successfully.",
      company,
    );
  } catch (error: unknown) {
    next(error);
  }
}
