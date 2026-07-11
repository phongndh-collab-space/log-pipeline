"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuthStore } from "@/src/stores/auth-store";

export function useAuthGuard() {
  const router = useRouter();
  const { status, user, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    }
  }, [router, status]);

  return {
    isLoading: status === "idle" || status === "loading",
    user,
  };
}
