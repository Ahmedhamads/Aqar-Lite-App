
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
  createReservationController,
  getReservationByIdController,
  getReservationsController,
} from "./reservation.controller";

import {
  createReservationSchema,
  reservationIdSchema,
  reservationListQuerySchema,
} from "./reservation.validation";

const reservationRouter = Router();

reservationRouter.use(
  authenticate,
  attachTenantContext,
);

reservationRouter.get(
  "/",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  validateQuery(reservationListQuerySchema),
  getReservationsController,
);

reservationRouter.get(
  "/:id",
  authorize("MANAGER", "ACCOUNTANT", "SALES"),
  validateParams(reservationIdSchema),
  getReservationByIdController,
);

reservationRouter.post(
  "/",
  authorize("SALES"),
  validateBody(createReservationSchema),
  createReservationController,
);

export default reservationRouter;
