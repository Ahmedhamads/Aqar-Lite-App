
export type UserRole = "MANAGER" | "ACCOUNTANT" | "SALES";

export interface AuthUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthSession {
  id?: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  session: AuthSession;
}

export interface MeResponse {
  user: AuthUser;
  session: AuthSession & {
    id: string;
  };
}
