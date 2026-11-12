
import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

import { ApiError } from "../shared/errors/api-error";

export function validateBody(schema: ZodType) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      next(
        new ApiError(
          422,
          "VALIDATION_ERROR",
          "Request validation failed.",
          errors,
        ),
      );
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodType) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      next(
        new ApiError(
          422,
          "VALIDATION_ERROR",
          "Query validation failed.",
          errors,
        ),
      );
      return;
    }

    res.locals.validatedQuery = result.data;
    next();
  };
}


export function validateParams(schema: ZodType) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      next(
        new ApiError(
          422,
          "VALIDATION_ERROR",
          "Route parameters validation failed.",
          errors,
        ),
      );
      return;
    }

    _res.locals.validatedParams = result.data;
    next();
  };
}
