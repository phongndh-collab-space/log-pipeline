"use client";

import { DashboardShell } from "@/src/components/common/dashboard-shell";
import { useAuthGuard } from "@/src/hooks/use-auth-guard";

export default function ProfilePage() {
  const { isLoading, user } = useAuthGuard();

  if (isLoading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0f0f0f] text-white">
        Loading profile...
      </main>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
          Profile
        </p>
        <h1 className="mt-4 text-4xl font-medium">Account details</h1>
        <div className="mt-8 rounded-2xl border border-[#222222] bg-[#181818] p-6">
          <ProfileRow label="Username" value={user.username} />
          <ProfileRow label="Account" value={user.account} />
          <ProfileRow label="Type" value={user.type} />
          <ProfileRow label="Role" value={`Role ${user.role}`} />
        </div>
      </div>
    </DashboardShell>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#242424] py-4 last:border-0">
      <span className="text-sm text-[#888888]">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
