import Link from "next/link";

import { AuthForm } from "@/src/components/features/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#0f0f0f] px-5 py-10 text-white md:grid-cols-2">
      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#181818] p-8">
          <Link href="/" className="text-sm font-medium text-[#6EB38B]">
            Personal Budget Tracker
          </Link>
          <h1 className="mt-6 text-3xl font-medium">Sign in</h1>
          <p className="mt-3 leading-7 text-[#a8a8a8]">
            Continue tracking budgets, spending, and savings goals.
          </p>
          <div className="mt-8">
            <AuthForm mode="login" />
          </div>
        </div>
      </section>
      <section className="hidden items-center justify-center md:flex">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
            Secure MVP auth
          </p>
          <h2 className="mt-4 text-5xl font-medium leading-tight">
            Your budget workspace, protected by JWT.
          </h2>
          <p className="mt-5 leading-7 text-[#a8a8a8]">
            Login is username and password for now, with the token stored on the
            client for authenticated API calls.
          </p>
        </div>
      </section>
    </main>
  );
}
