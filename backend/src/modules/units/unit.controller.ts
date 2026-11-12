
import type { Request, Response } from "express";

import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/http/send-success";
import {
  createCompanyUnit,
  updateCompanyUnit,
  deleteCompanyUnit,
} from "./unit.service";

import type {
  CreateUnitInput,
  UpdateUnitInput,
} from "./unit.validation";
import {
  getCompanyUnitById,
  getCompanyUnits,
} from "./unit.service";

import type { UnitListQuery } from "./unit.validation";

export async function getUnitsController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.tenant) {
    throw new ApiError(
      401,
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required.",
    );
  }

  const query = res.locals.validatedQuery as UnitListQuery;

 
const result = await getCompanyUnits({
  companyId: req.tenant.companyId,
  page: query.page,
  limit: query.limit,

  ...(query.status !== undefined
    ? { status: query.status }
    : {}),

  ...(query.minPrice !== undefined
    ? { minPrice: query.minPrice }
    : {}),

  ...(query.maxPrice !== undefined
    ? { maxPrice: query.maxPrice }
    : {}),

  sortBy: query.sortBy,
  sortOrder: query.sortOrder,
});


  sendSuccess(res, "Units retrieved successfully.", result);
}

export async function getUnitByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.tenant) {
    throw new ApiError(
      401,
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required.",
    );
  }

  const unitId = req.params.id;

    if (typeof unitId !== "string") {
    throw new ApiError(
        400,
        "INVALID_UNIT_ID",
        "A valid unit ID is required.",
    );
    }

  const unit = await getCompanyUnitById(
    req.tenant.companyId,
    unitId,
  );

  if (!unit) {
    throw new ApiError(404, "UNIT_NOT_FOUND", "Unit not found.");
  }

  sendSuccess(res, "Unit retrieved successfully.", unit);
}


export async function createUnitController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.tenant) {
    throw new ApiError(
      401,
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required.",
    );
  }

  const input = req.body as CreateUnitInput;

  const unit  = await createCompanyUnit(
  req.tenant!.companyId,
  req.body,
  req.tenant!.userId,
  req.ip ?? null,
);

  sendSuccess(
    res,
    "Unit created successfully.",
    unit,
    201,
  );
}


export async function updateUnitController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.tenant) {
    throw new ApiError(
      401,
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required.",
    );
  }

  const unitId = req.params.id;

  if (typeof unitId !== "string") {
    throw new ApiError(
      400,
      "INVALID_UNIT_ID",
      "A valid unit ID is required.",
    );
  }

  const input = req.body as UpdateUnitInput;

  const unit = await updateCompanyUnit(
  req.tenant!.companyId,
  req.tenant!.userId,
  unitId,
  req.body,
  req.ip ?? null,
);

  sendSuccess(
    res,
    "Unit updated successfully.",
    unit,
  );
}


export async function deleteUnitController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.tenant) {
    throw new ApiError(
      401,
      "TENANT_CONTEXT_MISSING",
      "Tenant context is required.",
    );
  }

  const unitId = req.params.id;

  if (typeof unitId !== "string") {
    throw new ApiError(
      400,
      "INVALID_UNIT_ID",
      "A valid unit ID is required.",
    );
  }

  const result = await deleteCompanyUnit(
  req.tenant!.companyId,
  unitId,
  req.tenant!.userId,
  req.ip ?? null,
);

  sendSuccess(
    res,
    "Unit deleted successfully.",
    result,
  );
}
