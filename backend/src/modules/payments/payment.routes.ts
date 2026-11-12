
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
  createPaymentController,
  getPaymentsController,
} from "./payment.controller";

import {
  contractIdParamsSchema,
  createPaymentSchema,
  paymentListQuerySchema,
} from "./payment.validation";

const paymentRouter = Router();

paymentRouter.use(
  authenticate,
  attachTenantContext,
);

// GET COMPANY PAYMENTS
paymentRouter.get(
  "/",
  authorize("MANAGER", "ACCOUNTANT"),
  validateQuery(paymentListQuerySchema),
  getPaymentsController,
);

// CREATE PAYMENT
paymentRouter.post(
  "/contracts/:contractId/payments",
  authorize("ACCOUNTANT"),
  validateParams(contractIdParamsSchema),
  validateBody(createPaymentSchema),
  createPaymentController,
);

export { paymentRouter };
