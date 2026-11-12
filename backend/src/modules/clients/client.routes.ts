
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
  createClientController,
  getClientByIdController,
  deleteClientController,
  getClientsController,
  updateClientController,
} from "./client.controller";

import {
  clientIdSchema,
  clientListQuerySchema,
  createClientSchema,
  updateClientSchema,
} from "./client.validation";

const clientRouter = Router();

clientRouter.use(
  authenticate,
  attachTenantContext,
  authorize("SALES"),
);

clientRouter.get(
  "/",
  validateQuery(clientListQuerySchema),
  getClientsController,
);

clientRouter.get(
  "/:id",
  validateParams(clientIdSchema),
  getClientByIdController,
);

clientRouter.post(
  "/",
  validateBody(createClientSchema),
  createClientController,
);

clientRouter.patch(
  "/:id",
  validateParams(clientIdSchema),
  validateBody(updateClientSchema),
  updateClientController,
);

clientRouter.delete(
  "/:id",
  validateParams(clientIdSchema),
  deleteClientController,
);

export default clientRouter;
