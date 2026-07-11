"use client";

import { create } from "zustand";

import { authService, type AuthPayload } from "@/src/services/auth-service";
import type { AuthUser } from "@/src/types/auth";

const TOKEN_STORAGE_KEY = "pbt_access_token";

type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (payload: AuthPayload) => Promise<void>;
  register: (payload: AuthPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  status: "idle",
  error: null,

  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      set({ status: "guest", token: null, user: null });
      return;
    }

    set({ status: "loading", token });

    try {
      const { user } = await authService.profile(token);
      set({ status: "authenticated", token, user, error: null });
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      set({ status: "guest", token: null, user: null });
    }
  },

  login: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const response = await authService.login(payload);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
      set({
        status: "authenticated",
        token: response.accessToken,
        user: response.user,
      });
    } catch (error) {
      set({
        status: "guest",
        error: error instanceof Error ? error.message : "Login failed",
      });
      throw error;
    }
  },

  register: async (payload) => {
    set({ status: "loading", error: null });

    try {
      const response = await authService.register(payload);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
      set({
        status: "authenticated",
        token: response.accessToken,
        user: response.user,
      });
    } catch (error) {
      set({
        status: "guest",
        error: error instanceof Error ? error.message : "Register failed",
      });
      throw error;
    }
  },

  logout: async () => {
    const token = get().token;

    if (token) {
      await authService.logout(token).catch(() => undefined);
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ status: "guest", token: null, user: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
