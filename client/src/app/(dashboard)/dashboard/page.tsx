"use client";

import { useEffect } from "react";
import { Wallet2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

import { DashboardShell } from "@/src/components/common/dashboard-shell";
import { useAuthGuard } from "@/src/hooks/use-auth-guard";
import { useAuthStore } from "@/src/stores/auth-store";
import { useFinanceStore } from "@/src/stores/finance-store";
import { WalletList } from "@/src/components/features/wallet-list";
import { TransactionDialog } from "@/src/components/features/transaction-dialog";
import { TransactionList } from "@/src/components/features/transaction-list";

export default function DashboardPage() {
  const { isLoading: authLoading, user } = useAuthGuard();
  const { token } = useAuthStore();
  const { fetchFinanceData, wallets, transactions } = useFinanceStore();
  const walletList = Array.isArray(wallets) ? wallets : [];
  const transactionList = Array.isArray(transactions) ? transactions : [];

  useEffect(() => {
    if (token) {
      fetchFinanceData(token);
    }
  }, [token, fetchFinanceData]);

  if (authLoading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0f0f0f] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#6EB38B] border-t-transparent" />
          <p className="text-sm text-neutral-400">Loading your profile...</p>
        </div>
      </main>
    );
  }

  // Calculate statistics
  const balanceByCurrency = walletList.reduce((acc, w) => {
    acc[w.currency] = (acc[w.currency] || 0) + w.balance;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (val: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr,
    }).format(val);
  };

  // Monthly stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactionList.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlyIncome = monthlyTransactions
    .filter((tx) => tx.type === "INCOME")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyExpense = monthlyTransactions
    .filter((tx) => tx.type === "EXPENSE")
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Use primary currency for stats summary (default VND, or the first wallet's currency)
  const mainCurrency = walletList[0]?.currency || "VND";

  return (
    <DashboardShell>
      {/* Welcome header & Quick Action */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6EB38B]">
            Overview Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Welcome, {user.username}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track and manage your personal finance visually.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TransactionDialog />
        </div>
      </section>

      {/* Top Overview Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Net Worth / Total Balance */}
        <article className="rounded-2xl border border-[#222222] bg-[#141414] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">TOTAL BALANCE</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-[#1f1f1f] text-[#6EB38B]">
              <Wallet2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            {Object.keys(balanceByCurrency).length > 0 ? (
              <div className="space-y-1">
                {Object.entries(balanceByCurrency).map(([curr, sum]) => (
                  <p key={curr} className="text-2xl font-bold text-white tracking-tight">
                    {formatCurrency(sum, curr)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-bold text-neutral-500">0</p>
            )}
            <p className="text-xs text-neutral-500 mt-2">Total balance across all your wallets.</p>
          </div>
        </article>

        {/* Monthly Income */}
        <article className="rounded-2xl border border-[#222222] bg-[#141414] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">MONTHLY INCOME</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-emerald-950/20 text-emerald-400">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-emerald-400 tracking-tight">
              {formatCurrency(monthlyIncome, mainCurrency)}
            </p>
            <p className="text-xs text-neutral-500 mt-2">Income recorded during this month.</p>
          </div>
        </article>

        {/* Monthly Expense */}
        <article className="rounded-2xl border border-[#222222] bg-[#141414] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">MONTHLY EXPENSE</span>
            <div className="grid h-8 w-8 place-items-center rounded bg-red-950/20 text-red-400">
              <TrendingDown className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-red-400 tracking-tight">
              {formatCurrency(monthlyExpense, mainCurrency)}
            </p>
            <p className="text-xs text-neutral-500 mt-2">Expenses paid during this month.</p>
          </div>
        </article>
      </section>

      {/* Main Grid: Wallets & Transactions */}
      <section className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Wallets */}
        <div className="lg:col-span-1 space-y-6">
          <WalletList />
        </div>

        {/* Right Column: Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#6EB38B]" />
              Transaction History
            </h2>
          </div>
          <TransactionList />
        </div>
      </section>
    </DashboardShell>
  );
}
