
import type { RequestHandler } from "express";
import type { UserRole } from "../generated/prisma/client";

import { ApiError } from "../shared/errors/api-error";

export function authorize(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(
        new ApiError(
          401,
          "UNAUTHENTICATED",
          "Authentication is required"
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "FORBIDDEN",
          "You do not have permission to perform this action"
        )
      );
    }

    next();
  };
}
