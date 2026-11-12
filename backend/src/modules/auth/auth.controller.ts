
import type { Request, Response, NextFunction } from "express";

import { env } from "../../config/env";
import { ApiError } from "../../shared/errors/api-error";
import { sendSuccess } from "../../shared/utils/api-response";
import { loginSchema } from "./auth.validation";
import { login } from "./auth.service";
import { revokeSession } from "./session.service";
import {
  authCookieOptions,
  authCookieClearOptions,
} from "./auth.cookies";

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid login data"
      );
    }

    const result = await login(validation.data, req.ip);

    res.cookie(
      env.COOKIE_NAME,
      result.token,
      authCookieOptions
    );

    sendSuccess(
      res,
      {
        user: result.user,
        session: {
          expiresAt: result.session.expiresAt,
        },
      },
      "Login successful"
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function meController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    console.log("ME CONTROLLER:", {
  hasUser: Boolean(req.user),
  hasSessionId: Boolean(req.sessionId),
  hasSessionExpiresAt: Boolean(req.sessionExpiresAt),
});
    if (!req.user || !req.sessionId || !req.sessionExpiresAt) {
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required"
      );
    }

    sendSuccess(
      res,
      {
        user: req.user,
        session: {
          id: req.sessionId,
          expiresAt: req.sessionExpiresAt,
        },
      },
      "Authenticated user retrieved successfully"
    );
  } catch (error: unknown) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token: unknown = req.cookies?.[env.COOKIE_NAME];

    if (typeof token === "string" && token.length > 0) {
      await revokeSession(token);
    }

    res.clearCookie(
      env.COOKIE_NAME,
      authCookieClearOptions
    );

    sendSuccess(
      res,
      {},
      "Logout successful"
    );
  } catch (error: unknown) {
    next(error);
  }
}
