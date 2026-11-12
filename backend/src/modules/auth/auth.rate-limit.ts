
import rateLimit from "express-rate-limit";

import { ApiError } from "../../shared/errors/api-error";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (_req, _res, next) => {
    next(
      new ApiError(
        429,
        "TOO_MANY_LOGIN_ATTEMPTS",
        "Too many login attempts. Please try again later."
      )
    );
  },
});
