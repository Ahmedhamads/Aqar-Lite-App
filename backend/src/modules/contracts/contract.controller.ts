
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";

import {
  approveCompanyContract,
  createCompanyContract,
  getCompanyContractById,
  getCompanyContracts,
} from "./contract.service";

import type {
  CreateContractInput,
  ContractListQuery,
} from "./contract.validation";

// ----------------------------------------
// CREATE CONTRACT DRAFT
// ----------------------------------------

export async function createContractController(
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

    const contract = await createCompanyContract(
      req.tenant.companyId,
      req.tenant.userId,
      req.body as CreateContractInput,
      req.ip ?? null,
    );

    sendSuccess(
      res,
      "Contract draft created successfully.",
      contract,
      201,
    );
  } catch (error: unknown) {
    next(error);
  }
}

// ----------------------------------------
// GET CONTRACTS
// ----------------------------------------

export async function getContractsController(
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
      res.locals.validatedQuery as ContractListQuery;

    const result = await getCompanyContracts(
      req.tenant.companyId,
      req.tenant.userId,
      req.tenant.role,
      query,
    );

    sendSuccess(
      res,
      "Contracts retrieved successfully.",
      result,
    );
  } catch (error: unknown) {
    next(error);
  }
}

// ----------------------------------------
// GET CONTRACT BY ID
// ----------------------------------------

export async function getContractByIdController(
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

    const contractId = req.params.id;

    if (typeof contractId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CONTRACT_ID",
        "Invalid contract ID.",
      );
    }

    const contract = await getCompanyContractById(
      req.tenant.companyId,
      contractId,
      req.tenant.userId,
      req.tenant.role,
    );

    sendSuccess(
      res,
      "Contract retrieved successfully.",
      contract,
    );
  } catch (error: unknown) {
    next(error);
  }
}

// ----------------------------------------
// APPROVE CONTRACT
// ----------------------------------------

export async function approveContractController(
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

    const contractId = req.params.id;

    if (typeof contractId !== "string") {
      throw new ApiError(
        400,
        "INVALID_CONTRACT_ID",
        "Invalid contract ID.",
      );
    }

    const contract = await approveCompanyContract(
      req.tenant.companyId,
      req.tenant.userId,
      contractId,
      req.ip ?? null,
    );

    sendSuccess(
      res,
      "Contract approved successfully.",
      contract,
    );
  } catch (error: unknown) {
    next(error);
  }
}
