
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000),

  API_PREFIX: z
    .string()
    .startsWith("/")
    .default("/api/v1"),

  DATABASE_URL: z
    .string()
    .url(),

  SESSION_SECRET: z
    .string()
    .min(32),

  SESSION_TTL_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .default(24),
    CSRF_COOKIE_NAME: z.string().min(1).default("aqar_csrf"),

  COOKIE_NAME: z
    .string()
    .min(1)
    .default("aqar_session"),

  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),

  COOKIE_SAME_SITE: z
    .enum(["strict", "lax", "none"])
    .default("lax"),

  CORS_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3000")

});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");

  console.error(
    z.treeifyError(parsedEnv.error)
  );

  process.exit(1);
}

export const env = parsedEnv.data;
