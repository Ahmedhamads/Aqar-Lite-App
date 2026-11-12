
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import {
  getCompanyContractInstallments,
} from "./installment.service";

import type {
  InstallmentListQuery,
} from "./installment.validation";

export async function getContractInstallmentsController(
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

    const contractId = req.params.contractId;

    if (typeof contractId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CONTRACT_ID",
        "Invalid contract ID.",
      );
    }

    const query = res.locals.validatedQuery as InstallmentListQuery;

    const result = await getCompanyContractInstallments({
      companyId: req.tenant.companyId,
      contractId,
      userId: req.tenant.userId,
      role: req.tenant.role,
      query,
    });

    sendSuccess(
      res,
      "Contract installments retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}
