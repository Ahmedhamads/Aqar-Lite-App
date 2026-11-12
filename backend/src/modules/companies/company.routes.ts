
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { attachTenantContext } from "../../middlewares/tenant.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import {
  validateBody,
} from "../../middlewares/validate.middleware";

import {
  getCurrentCompanyController,
  updateCurrentCompanyController,
} from "./company.controller";

import { updateCompanySchema } from "./company.validation";

const companyRouter = Router();

companyRouter.use(
  authenticate,
  attachTenantContext,
);

// ----------------------------------------
// GET CURRENT COMPANY
// ALL AUTHENTICATED ROLES
// ----------------------------------------

companyRouter.get(
  "/me",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  getCurrentCompanyController,
);

// ----------------------------------------
// UPDATE CURRENT COMPANY
// MANAGER ONLY
// ----------------------------------------

companyRouter.patch(
  "/me",
  authorize("MANAGER"),
  validateBody(updateCompanySchema),
  updateCurrentCompanyController,
);

export { companyRouter };
