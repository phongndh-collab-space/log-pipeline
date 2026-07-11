import Link from "next/link";

import { AuthForm } from "@/src/components/features/auth-form";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen bg-[#0f0f0f] px-5 py-10 text-white md:grid-cols-2">
      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#181818] p-8">
          <Link href="/" className="text-sm font-medium text-[#6EB38B]">
            Personal Budget Tracker
          </Link>
          <h1 className="mt-6 text-3xl font-medium">Create account</h1>
          <p className="mt-3 leading-7 text-[#a8a8a8]">
            Start with a username and password. You can expand profile details
            later.
          </p>
          <div className="mt-8">
            <AuthForm mode="register" />
          </div>
        </div>
      </section>
      <section className="hidden items-center justify-center md:flex">
        <div className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
            Quick setup
          </p>
          <h2 className="mt-4 text-5xl font-medium leading-tight">
            Create your finance control room in under a minute.
          </h2>
          <p className="mt-5 leading-7 text-[#a8a8a8]">
            This MVP account unlocks the dashboard and profile page while the
            finance modules come next.
          </p>
        </div>
      </section>
    </main>
  );
}
