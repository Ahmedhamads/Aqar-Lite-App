
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { attachTenantContext } from "../../middlewares/tenant.middleware";
import { authorize } from "../../middlewares/authorize.middleware";
import { validateQuery } from "../../middlewares/validate.middleware";

import { getAuditLogsController } from "./audit.controller";
import { auditListQuerySchema } from "./audit.validation";

const auditRouter = Router();

auditRouter.use(
  authenticate,
  attachTenantContext,
  authorize("MANAGER"),
);

auditRouter.get(
  "/",
  validateQuery(auditListQuerySchema),
  getAuditLogsController,
);

export { auditRouter };
