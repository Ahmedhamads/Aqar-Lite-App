
import { createHash, randomBytes } from "node:crypto";
import { ApiError } from "../../shared/errors/api-error";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { createAuditLog } from "../../shared/audit/audit.service";

interface CreateSessionInput {
  userId: string;
  companyId: string;
  email: string;
  role: "MANAGER" | "ACCOUNTANT" | "SALES";
  ipAddress?: string;
}

interface CreatedSession {
  sessionId: string;
  token: string;
  expiresAt: Date;
}

export interface ValidSession {
  id: string;
  userId: string;
  companyId: string;
  expiresAt: Date;
  user: {
    id: string;
    companyId: string;
    name: string;
    email: string;
    role: "MANAGER" | "ACCOUNTANT" | "SALES";
    isActive: boolean;
  };
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

// ----------------------------------------
// CREATE SESSION + LOGIN AUDIT
// ----------------------------------------

export async function createSession(
  input: CreateSessionInput,
): Promise<CreatedSession> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  const expiresAt = new Date(
    Date.now() +
      env.SESSION_TTL_HOURS * 60 * 60 * 1000,
  );

  const session = await prisma.$transaction(async (tx) => {
    const activeUser = await tx.user.findFirst({
  where: {
    id: input.userId,
    companyId: input.companyId,
    isActive: true,
  },
  select: {
    id: true,
    email: true,
    role: true,
  },
});

if (!activeUser) {
  throw new ApiError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password.",
  );
}
    const createdSession = await tx.session.create({
      data: {
        userId: input.userId,
        companyId: input.companyId,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    await createAuditLog(tx, {
      companyId: input.companyId,
      actorId: input.userId,
      action: "LOGIN_SUCCESS",
      entityType: "Session",
      entityId: createdSession.id,
      ipAddress: input.ipAddress ?? null,
      metadata: {
        email: input.email,
        role: input.role,
        expiresAt: createdSession.expiresAt.toISOString(),
      },
    });

    await tx.loginAttempt.create({
      data: {
        email: input.email,
        ipAddress: input.ipAddress ?? null,
        success: true,
      },
    });

    return createdSession;
  });

  return {
    sessionId: session.id,
    token,
    expiresAt: session.expiresAt,
  };
}

// ----------------------------------------
// GET SESSION BY TOKEN
// ----------------------------------------

export async function getSessionByToken(
  token: string,
): Promise<ValidSession | null> {
  const tokenHash = hashToken(token);

  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
      user: {
        isActive: true,
      },
    },
    select: {
      id: true,
      userId: true,
      companyId: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          companyId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
    },
  });

  return session;
}

// ----------------------------------------
// REVOKE SESSION + LOGOUT AUDIT
// ----------------------------------------

export async function revokeSession(
  token: string,
  ipAddress?: string,
): Promise<void> {
  const tokenHash = hashToken(token);

  await prisma.$transaction(async (tx) => {
    const session = await tx.session.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      select: {
        id: true,
        userId: true,
        companyId: true,
      },
    });

    if (!session) {
      return;
    }

    const result = await tx.session.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count !== 1) {
      return;
    }

    await createAuditLog(tx, {
      companyId: session.companyId,
      actorId: session.userId,
      action: "LOGOUT",
      entityType: "Session",
      entityId: session.id,
      ipAddress: ipAddress ?? null,
      metadata: {
        revokedAt: new Date().toISOString(),
      },
    });
  });
}
