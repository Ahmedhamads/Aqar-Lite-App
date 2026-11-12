
import { Router } from "express";

import {
  loginController,
  logoutController,
  meController,
} from "./auth.controller";

import { loginRateLimiter } from "./auth.rate-limit";
import { authenticate } from "../../middlewares/auth.middleware";
import { getCsrfTokenController } from "./csrf.controller";
import { validateBody } from "../../middlewares/validate.middleware";
import { loginSchema } from "./auth.validation";
import { csrfProtection } from "../../middlewares/csrf.middleware";
const authRouter = Router();


authRouter.get("/csrf", getCsrfTokenController);
authRouter.post(
  "/login",
  loginRateLimiter,
  csrfProtection,
  validateBody(loginSchema),
  loginController,
);
authRouter.get(
  "/me",
  authenticate,
  meController
);

authRouter.post(
  "/logout",
  logoutController
);


export default authRouter;
