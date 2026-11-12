
import argon2 from "argon2";

import { prisma } from "../../config/database";
import { ApiError } from "../../shared/errors/api-error";

import type { LoginInput } from "./auth.validation";
import type {
  AuthenticatedUser,
  LoginResult,
} from "./auth.types";

import { createSession } from "./session.service";

const INVALID_CREDENTIALS_MESSAGE =
  "Invalid email or password";

// ----------------------------------------
// RECORD FAILED LOGIN ATTEMPT
// ----------------------------------------

async function recordLoginAttempt(
  email: string,
  ipAddress: string | undefined,
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email,
        ipAddress: ipAddress ?? null,
        success: false,
      },
    });
  } catch (error: unknown) {
    // Do not expose storage errors to the client.
    console.error(
      "Failed to record login attempt:",
      error,
    );
  }
}

// ----------------------------------------
// LOGIN
// ----------------------------------------

export async function login(
  input: LoginInput,
  ipAddress?: string,
): Promise<LoginResult & { token: string }> {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
  });

  if (!user || !user.isActive) {
    await recordLoginAttempt(
      input.email,
      ipAddress,
    );

    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      INVALID_CREDENTIALS_MESSAGE,
    );
  }

  const isPasswordValid = await argon2.verify(
    user.passwordHash,
    input.password,
  );

  if (!isPasswordValid) {
    await recordLoginAttempt(
      input.email,
      ipAddress,
    );

    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      INVALID_CREDENTIALS_MESSAGE,
    );
  }

  const session = await createSession({
    userId: user.id,
    companyId: user.companyId,
    email: user.email,
    role: user.role,
    ...(ipAddress !== undefined && { ipAddress }),
  });

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return {
    user: authenticatedUser,
    session: {
      id: session.sessionId,
      userId: user.id,
      companyId: user.companyId,
      expiresAt: session.expiresAt,
    },
    token: session.token,
  };
}
