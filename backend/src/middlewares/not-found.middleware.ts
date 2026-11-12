
import type { RequestHandler } from "express";

import { ApiError } from "../shared/errors/api-error";

export const notFoundMiddleware: RequestHandler = (
  req,
  _res,
  next
) => {
  next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${req.method} ${req.originalUrl} not found`
    )
  );
};
