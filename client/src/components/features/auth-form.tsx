"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useAuthStore } from "@/src/stores/auth-store";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register, status, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const isRegister = mode === "register";
  const isLoading = status === "loading";

  useEffect(() => {
    clearError();
  }, [clearError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = { username, password };

    if (isRegister) {
      await register(payload);
    } else {
      await login(payload);
    }

    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#d8d8d8]">
          Username
        </label>
        <Input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="phong"
          autoComplete="username"
          minLength={3}
          maxLength={32}
          required
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[#d8d8d8]">
          Password
        </label>
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="At least 6 characters"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={6}
          required
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isRegister ? "Create account" : "Sign in"}
        {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
      <p className="text-center text-sm text-[#a8a8a8]">
        {isRegister ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-[#6EB38B]"
        >
          {isRegister ? "Sign in" : "Create one"}
        </Link>
      </p>
    </form>
  );
}
