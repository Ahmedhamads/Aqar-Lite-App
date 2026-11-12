
import { Router } from "express";

import {
  createUserController,
  getUsersController,
  getUserByIdController,
  updateUserController,
  updateUserStatusController,
} from "./user.controller";

import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamsSchema,
  userListQuerySchema,
} from "./user.validation";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middlewares/validate.middleware";

import { authenticate } from "../../middlewares/auth.middleware";
import {
  attachTenantContext,
  requireTenantContext,
} from "../../middlewares/tenant.middleware";
import { authorize } from "../../middlewares/authorize.middleware";

const router = Router();

router.use(authenticate);
router.use(attachTenantContext);
router.use(authorize("MANAGER"));
router.use(requireTenantContext);

router.post(
  "/",
  validateBody(createUserSchema),
  createUserController,
);

router.get(
  "/",
  validateQuery(userListQuerySchema),
  getUsersController,
);

router.get(
  "/:id",
  validateParams(userIdParamsSchema),
  getUserByIdController,
);

router.patch(
  "/:id",
  validateParams(userIdParamsSchema),
  validateBody(updateUserSchema),
  updateUserController,
);

router.patch(
  "/:id/status",
  validateParams(userIdParamsSchema),
  validateBody(updateUserStatusSchema),
  updateUserStatusController,
);

export default router;
