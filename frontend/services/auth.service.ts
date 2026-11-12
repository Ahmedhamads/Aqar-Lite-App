
import { apiClient } from "@/lib/api/client";

import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
} from "@/types/auth.types";

export const authService = {
  login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>(
      "/auth/login",
      credentials,
    );
  },

  me(): Promise<MeResponse> {
    return apiClient.get<MeResponse>("/auth/me");
  },

  logout(): Promise<Record<string, never>> {
    return apiClient.post<Record<string, never>>(
      "/auth/logout",
      undefined,
      {
        csrf: false,
      },
    );
  },
};
