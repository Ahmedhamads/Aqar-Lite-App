
import type { Request, Response } from "express";

import { env } from "../../config/env";
import {
  csrfCookieOptions,
  generateCsrfToken,
} from "./csrf.service";

export function getCsrfTokenController(
  _req: Request,
  res: Response,
): void {
  const csrfToken = generateCsrfToken();

  res.cookie(
    env.CSRF_COOKIE_NAME,
    csrfToken,
    csrfCookieOptions,
  );

  res.status(200).json({
    success: true,
    message: "CSRF token generated successfully.",
    data: {
      csrfToken,
    },
  });
}
