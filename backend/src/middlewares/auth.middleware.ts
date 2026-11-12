
import type { Request, Response, NextFunction } from "express";

import { ApiError } from "../shared/errors/api-error";
import { env } from "../config/env";
import { getSessionByToken } from "../modules/auth/session.service";
import type { AuthenticatedUser } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
      sessionExpiresAt?: Date;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[env.COOKIE_NAME] as
      | string
      | undefined;

    if (!token) {
      throw new ApiError(
        401,
        "UNAUTHENTICATED",
        "Authentication is required.",
      );
    }

    const session = await getSessionByToken(token);

    if (!session) {
      throw new ApiError(
        401,
        "INVALID_SESSION",
        "Your session is invalid or expired.",
      );
    }

    req.user = {
      id: session.user.id,
      companyId: session.user.companyId,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };

    req.sessionId = session.id;
    req.sessionExpiresAt = session.expiresAt;

    next();
  } catch (error: unknown) {
    next(error);
  }
}
