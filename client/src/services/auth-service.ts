import { apiRequest } from "@/src/services/api";
import type { AuthResponse, AuthUser } from "@/src/types/auth";

export type AuthPayload = {
  username: string;
  password: string;
};

export const authService = {
  register(payload: AuthPayload) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload: AuthPayload) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  profile(token: string) {
    return apiRequest<{ user: AuthUser }>("/auth/profile", {
      method: "GET",
      token,
    });
  },

  logout(token: string) {
    return apiRequest<{ message: string }>("/auth/logout", {
      method: "POST",
      token,
    });
  },
};
