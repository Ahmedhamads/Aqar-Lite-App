
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ApiError } from "@/lib/api/errors";
import { authService } from "@/services/auth.service";

import type {
  AuthUser,
  LoginCredentials,
} from "@/types/auth.types";

type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshUser = useCallback(async () => {
    setStatus("loading");

    try {
      const response = await authService.me();

      setUser(response.user);
      setStatus("authenticated");
    } catch (error) {
      setUser(null);

      if (
        error instanceof ApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        setStatus("unauthenticated");
        return;
      }

      setStatus("error");
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const response = await authService.me();

        if (!active) return;

        setUser(response.user);
        setStatus("authenticated");
      } catch (error) {
        if (!active) return;

        setUser(null);

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          setStatus("unauthenticated");
        } else {
          setStatus("error");
        }
      }
    }

    void initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authService.login(credentials);

      setUser(response.user);
      setStatus("authenticated");
    },
    [],
  );

  const logout = useCallback(async () => {
    await authService.logout();

    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside AuthProvider.",
    );
  }

  return context;
}
