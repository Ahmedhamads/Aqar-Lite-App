
import type { CookieOptions } from "express";

import { env } from "../../config/env";

const cookieBaseOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
};

export const authCookieOptions: CookieOptions = {
  ...cookieBaseOptions,
  maxAge: env.SESSION_TTL_HOURS * 60 * 60 * 1000,
};

export const authCookieClearOptions: CookieOptions = {
  ...cookieBaseOptions,
};
