"use client";

import { useState } from "react";
import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Receipt,
  Briefcase,
  Laptop,
  Gift,
  ArrowRightLeft,
  HelpCircle,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { useFinanceStore } from "@/src/stores/finance-store";
import { useAuthStore } from "@/src/stores/auth-store";

export function TransactionList() {
  const { transactions, wallets, deleteTransaction } = useFinanceStore();
  const { token } = useAuthStore();
  const transactionList = Array.isArray(transactions) ? transactions : [];
  const walletList = Array.isArray(wallets) ? wallets : [];

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [walletFilter, setWalletFilter] = useState<string>("ALL");

  const getCategoryIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case "utensils":
        return <Utensils className="h-4 w-4" />;
      case "car":
        return <Car className="h-4 w-4" />;
      case "shoppingbag":
        return <ShoppingBag className="h-4 w-4" />;
      case "film":
        return <Film className="h-4 w-4" />;
      case "receipt":
        return <Receipt className="h-4 w-4" />;
      case "briefcase":
        return <Briefcase className="h-4 w-4" />;
      case "laptop":
        return <Laptop className="h-4 w-4" />;
      case "gift":
        return <Gift className="h-4 w-4" />;
      case "arrowrightleft":
        return <ArrowRightLeft className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (val: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr || "VND",
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (confirm("Are you sure you want to delete this transaction? The wallet balance will be reverted.")) {
      try {
        await deleteTransaction(id, token);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete transaction");
      }
    }
  };

  // Filter logic
  const filteredTransactions = transactionList.filter((tx) => {
    const matchesSearch = tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || tx.type === typeFilter;
    const matchesWallet = walletFilter === "ALL" || 
                          String(tx.walletId) === walletFilter || 
                          String(tx.toWalletId) === walletFilter;
    return matchesSearch && matchesType && matchesWallet;
  });

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-[#222222] bg-[#141414] p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-[#222222] bg-[#0f0f0f] py-2 pl-9 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#6EB38B]"
          />
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-[#222222] bg-[#0f0f0f] px-2.5 py-1">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>

          {/* Wallet Filter */}
          <div className="flex items-center gap-1.5 rounded-md border border-[#222222] bg-[#0f0f0f] px-2.5 py-1">
            <Filter className="h-3.5 w-3.5 text-neutral-500" />
            <select
              value={walletFilter}
              onChange={(e) => setWalletFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Wallets</option>
              {walletList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#222222] bg-[#141414]">
        <table className="w-full border-collapse text-left text-sm text-neutral-400">
          <thead className="bg-[#181818] text-xs font-semibold uppercase text-neutral-300 border-b border-[#222222]">
            <tr>
              <th className="px-6 py-4">Transaction</th>
              <th className="px-6 py-4">Wallet</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {filteredTransactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-[#1c1c1c] transition-colors group">
                {/* Description / Type */}
                <td className="px-6 py-4">
                  <div className="font-medium text-white">
                    {tx.description || (tx.type === "TRANSFER" ? "Transfer Fund" : tx.category?.name)}
                  </div>
                  <div className="text-xs text-neutral-500 capitalize">
                    {tx.type.toLowerCase()}
                  </div>
                </td>
                
                {/* Wallet Info */}
                <td className="px-6 py-4">
                  {tx.type === "TRANSFER" ? (
                    <div className="flex items-center gap-1">
                      <span className="text-white text-xs font-medium">{tx.wallet?.name}</span>
                      <ArrowRightLeft className="h-3 w-3 text-neutral-500" />
                      <span className="text-white text-xs font-medium">{tx.toWallet?.name}</span>
                    </div>
                  ) : (
                    <span className="text-white text-xs font-medium">{tx.wallet?.name}</span>
                  )}
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  {tx.type === "TRANSFER" ? (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <div className="grid h-6 w-6 place-items-center rounded bg-[#222222]">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                      </div>
                      Transfer
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                      <div
                        className="grid h-6 w-6 place-items-center rounded"
                        style={{
                          backgroundColor: tx.category?.color ? `${tx.category.color}20` : "#222222",
                          color: tx.category?.color || "#888888",
                        }}
                      >
                        {getCategoryIcon(tx.category?.icon || "")}
                      </div>
                      {tx.category?.name || "Uncategorized"}
                    </div>
                  )}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-xs">
                  {formatDate(tx.date)}
                </td>

                {/* Amount */}
                <td className={`px-6 py-4 text-right font-semibold text-base ${
                  tx.type === "INCOME"
                    ? "text-emerald-400"
                    : tx.type === "EXPENSE"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}>
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "-" : ""}
                  {formatCurrency(tx.amount, tx.wallet?.currency)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-all p-1"
                    title="Delete Transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                  No transactions found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
