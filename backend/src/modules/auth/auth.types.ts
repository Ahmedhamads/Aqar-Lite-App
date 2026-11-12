
import type { UserRole } from "../../generated/prisma/client";

export interface AuthenticatedUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedSession {
  id: string;
  userId: string;
  companyId: string;
  expiresAt: Date;
}

export interface LoginResult {
  user: AuthenticatedUser;
  session: AuthenticatedSession;
}
