"use client";

import { useState } from "react";
import { Plus, X, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from "lucide-react";
import { useFinanceStore } from "@/src/stores/finance-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function TransactionDialog() {
  const { wallets, categories, createTransaction } = useFinanceStore();
  const { token } = useAuthStore();
  const walletList = Array.isArray(wallets) ? wallets : [];
  const categoryList = Array.isArray(categories) ? categories : [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");
  
  // Fields
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categoryList.filter((c) => c.type === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");

    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!walletId) {
      setError("Please select a wallet");
      return;
    }

    if (activeTab === "TRANSFER") {
      if (!toWalletId) {
        setError("Please select a destination wallet");
        return;
      }
      if (walletId === toWalletId) {
        setError("Source and destination wallets must be different");
        return;
      }
    } else {
      if (!categoryId) {
        setError("Please select a category");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await createTransaction(
        {
          amount: numAmount,
          type: activeTab,
          description: description.trim(),
          walletId: Number(walletId),
          toWalletId: activeTab === "TRANSFER" ? Number(toWalletId) : undefined,
          categoryId: activeTab !== "TRANSFER" ? Number(categoryId) : undefined,
          date: date ? new Date(date).toISOString() : undefined,
        },
        token
      );
      
      // Reset form
      setAmount("");
      setDescription("");
      setWalletId("");
      setToWalletId("");
      setCategoryId("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          if (walletList.length === 0) {
            alert("Please create at least one wallet first!");
            return;
          }
          // Set default wallet
          setWalletId(String(walletList[0].id));
          setIsOpen(true);
        }}
        className="bg-[#1F4D36] text-white hover:bg-[#2e7451] font-semibold"
      >
        <Plus className="mr-2 h-4 w-4" /> New Transaction
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#141414] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#222222] bg-[#101010]">
              <h3 className="text-lg font-bold text-white">Record Transaction</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError("");
                }}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-3 border-b border-[#222222] bg-[#101010]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("EXPENSE");
                  setCategoryId("");
                  setError("");
                }}
                className={`py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "EXPENSE"
                    ? "border-red-500 text-red-500 bg-red-950/5"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("INCOME");
                  setCategoryId("");
                  setError("");
                }}
                className={`py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "INCOME"
                    ? "border-emerald-500 text-emerald-500 bg-emerald-950/5"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("TRANSFER");
                  setCategoryId("");
                  setError("");
                }}
                className={`py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                  activeTab === "TRANSFER"
                    ? "border-blue-500 text-blue-500 bg-blue-950/5"
                    : "border-transparent text-neutral-400 hover:text-white"
                }`}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Transfer
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/50 p-2.5 rounded-lg">
                  {error}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-neutral-400">Amount</label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border-[#222222] bg-[#0f0f0f] text-white text-lg font-semibold pl-3"
                    autoFocus
                  />
                </div>
              </div>

              {/* Wallet Select */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400">
                    {activeTab === "TRANSFER" ? "From Wallet" : "Wallet"}
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#222222] bg-[#0f0f0f] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6EB38B]"
                  >
                    <option value="" disabled>Select</option>
                    {walletList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.currency})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Destination Wallet or Category */}
                {activeTab === "TRANSFER" ? (
                  <div>
                    <label className="text-xs font-semibold text-neutral-400">To Wallet</label>
                    <select
                      value={toWalletId}
                      onChange={(e) => setToWalletId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-[#222222] bg-[#0f0f0f] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6EB38B]"
                    >
                      <option value="">Select Wallet</option>
                      {walletList.map((w) => (
                        <option key={w.id} value={w.id} disabled={String(w.id) === walletId}>
                          {w.name} ({w.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-neutral-400">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-[#222222] bg-[#0f0f0f] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6EB38B]"
                    >
                      <option value="">Select Category</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 border-[#222222] bg-[#0f0f0f] text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-400">Description</label>
                  <Input
                    placeholder="Lunch, taxi ride..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 border-[#222222] bg-[#0f0f0f] text-white"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    setError("");
                  }}
                  className="text-neutral-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`text-white font-semibold ${
                    activeTab === "EXPENSE"
                      ? "bg-red-700 hover:bg-red-800"
                      : activeTab === "INCOME"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                >
                  {isSubmitting ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
