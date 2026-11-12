
import type { Request, Response, NextFunction } from "express";

import { ApiError } from "../shared/errors/api-error";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.errors ? { details: error.errors } : {}),
      },
    });

    return;
  }

  // Keep internal error details out of the API response.
  console.error("Unhandled application error:", error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}
