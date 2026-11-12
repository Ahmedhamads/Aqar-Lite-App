
import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

import { env } from "../config/env";
import { ApiError } from "../shared/errors/api-error";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Safe methods do not change server state.
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Validate the request origin.
  const origin = req.get("origin");

  if (!origin || origin !== env.CORS_ORIGIN) {
    next(
      new ApiError(
        403,
        "INVALID_ORIGIN",
        "Request origin is not allowed.",
      ),
    );
    return;
  }

  // Read the CSRF token from the cookie and request header.
  const cookieToken = req.cookies?.[env.CSRF_COOKIE_NAME];
  const headerToken = req.get("X-CSRF-Token");

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    cookieToken.length === 0 ||
    headerToken.length === 0
  ) {
    next(
      new ApiError(
        403,
        "CSRF_TOKEN_MISSING",
        "CSRF token is missing.",
      ),
    );
    return;
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  // timingSafeEqual requires buffers of equal length.
  if (
    cookieBuffer.length !== headerBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    next(
      new ApiError(
        403,
        "CSRF_TOKEN_INVALID",
        "CSRF token is invalid.",
      ),
    );
    return;
  }

  next();
}
