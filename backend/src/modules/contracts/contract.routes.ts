
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
  approveContractController,
  createContractController,
  getContractByIdController,
  getContractsController,
} from "./contract.controller";

import {
  contractIdSchema,
  contractListQuerySchema,
  createContractSchema,
} from "./contract.validation";

const contractRouter = Router();

// All contract routes require authentication and tenant context.
contractRouter.use(
  authenticate,
  attachTenantContext,
);

// ----------------------------------------
// CREATE DRAFT
// SALES ONLY
// ----------------------------------------

contractRouter.post(
  "/",
  authorize("SALES"),
  validateBody(createContractSchema),
  createContractController,
);

// ----------------------------------------
// LIST CONTRACTS
// ALL AUTHENTICATED ROLES
// ----------------------------------------

contractRouter.get(
  "/",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  validateQuery(contractListQuerySchema),
  getContractsController,
);

// ----------------------------------------
// GET CONTRACT BY ID
// ALL AUTHENTICATED ROLES
// ----------------------------------------

contractRouter.get(
  "/:id",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  validateParams(contractIdSchema),
  getContractByIdController,
);

// ----------------------------------------
// APPROVE CONTRACT
// ACCOUNTANT ONLY
// ----------------------------------------

contractRouter.post(
  "/:id/approve",
  authorize("ACCOUNTANT"),
  validateParams(contractIdSchema),
  approveContractController,
);

export { contractRouter };
