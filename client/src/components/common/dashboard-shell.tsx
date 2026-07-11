"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, UserRound, WalletCards } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { useAuthStore } from "@/src/stores/auth-store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-[#1a1a1a] bg-[#0f0f0f]">
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-3 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#1F4D36]">
              <WalletCards className="h-5 w-5" />
            </span>
            Personal Budget Tracker
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/profile">
                <UserRound className="h-4 w-4" />
                {user?.username ?? "Profile"}
              </Link>
            </Button>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-6xl px-5 py-10">{children}</div>
    </main>
  );
}
