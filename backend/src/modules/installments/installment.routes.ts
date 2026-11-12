
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { attachTenantContext } from "../../middlewares/tenant.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

import {
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import {
  getContractInstallmentsController,
} from "./installment.controller";

import {
  installmentContractParamsSchema,
  installmentListQuerySchema,
} from "./installment.validation";

const installmentRouter = Router();

installmentRouter.use(
  authenticate,
  attachTenantContext,
);

installmentRouter.get(
  "/contracts/:contractId/installments",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  validateParams(installmentContractParamsSchema),
  validateQuery(installmentListQuerySchema),
  getContractInstallmentsController,
);

export { installmentRouter };
