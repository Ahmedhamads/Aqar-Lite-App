
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { attachTenantContext } from "../../middlewares/tenant.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import {
  createUnitController,
  deleteUnitController,
  getUnitByIdController,
  getUnitsController,
  updateUnitController,
} from "./unit.controller";

import {
  createUnitSchema,
  unitIdSchema,
  unitListQuerySchema,
  updateUnitSchema,
} from "./unit.validation";

const unitRouter = Router();

// Read units
unitRouter.get(
  "/",
  authenticate,
  attachTenantContext,
  validateQuery(unitListQuerySchema),
  getUnitsController,
);

unitRouter.get(
  "/:id",
  authenticate,
  attachTenantContext,
  validateParams(unitIdSchema),
  getUnitByIdController,
);

// Create unit - Manager only
unitRouter.post(
  "/",
  authenticate,
  attachTenantContext,
  authorize("MANAGER"),
  validateBody(createUnitSchema),
  createUnitController,
);

// Update unit - Manager only
unitRouter.patch(
  "/:id",
  authenticate,
  attachTenantContext,
  authorize("MANAGER"),
  validateParams(unitIdSchema),
  validateBody(updateUnitSchema),
  updateUnitController,
);

// Delete unit - Manager only
unitRouter.delete(
  "/:id",
  authenticate,
  attachTenantContext,
  authorize("MANAGER"),
  validateParams(unitIdSchema),
  deleteUnitController,
);

export default unitRouter;
