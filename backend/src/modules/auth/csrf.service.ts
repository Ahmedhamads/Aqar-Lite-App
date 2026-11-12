
import { randomBytes } from "node:crypto";
import type { CookieOptions } from "express";

import { env } from "../../config/env";

export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
};

export const csrfCookieClearOptions: CookieOptions = {
  httpOnly: false,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
};
