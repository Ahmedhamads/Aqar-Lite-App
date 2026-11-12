import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { attachTenantContext } from "../../middlewares/tenant.middleware";

import { getDashboardSummaryController } from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.use(
  authenticate,
  attachTenantContext,
);

dashboardRouter.get(
  "/summary",
  getDashboardSummaryController,
);

export default dashboardRouter;