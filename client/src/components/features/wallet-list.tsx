"use client";

import { useState } from "react";
import { Plus, Trash2, Wallet2 } from "lucide-react";
import { useFinanceStore } from "@/src/stores/finance-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function WalletList() {
  const { wallets, createWallet, deleteWallet } = useFinanceStore();
  const { token } = useAuthStore();
  const walletList = Array.isArray(wallets) ? wallets : [];
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("VND");
  const [error, setError] = useState("");

  const formatCurrency = (val: number, curr: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: curr || "VND",
    }).format(val);
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Wallet name is required");
      return;
    }
    if (!token) return;

    try {
      await createWallet(
        {
          name: name.trim(),
          balance: Number(balance) || 0,
          currency,
        },
        token
      );
      setName("");
      setBalance("0");
      setCurrency("VND");
      setIsOpen(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create wallet");
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (confirm("Are you sure you want to delete this wallet? All associated transactions will be deleted!")) {
      try {
        await deleteWallet(id, token);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete wallet");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Wallet2 className="h-5 w-5 text-[#6EB38B]" />
          My Wallets
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="border-[#222222] bg-[#181818] text-[#a8a8a8] hover:bg-[#222222] hover:text-white"
        >
          <Plus className="mr-1 h-4 w-4" /> Add Wallet
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {walletList.map((wallet) => (
          <div
            key={wallet.id}
            className="group relative rounded-2xl border border-[#222222] bg-[#141414] p-5 hover:border-[#333333] transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#1e1e1e] text-[#a8a8a8]">
                {wallet.currency}
              </span>
              <button
                onClick={() => handleDelete(wallet.id)}
                className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity"
                title="Delete Wallet"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="mt-3 font-semibold text-[#efefef] text-sm truncate">
              {wallet.name}
            </h3>
            <p className="mt-2 text-xl font-bold text-[#6EB38B] tracking-tight">
              {formatCurrency(wallet.balance, wallet.currency)}
            </p>
          </div>
        ))}

        {walletList.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[#222222] bg-[#141414]">
            <p className="text-neutral-500 text-sm">No wallets created yet.</p>
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              className="text-[#6EB38B] hover:text-white mt-1 p-0 h-auto hover:bg-transparent"
            >
              Create your first wallet
            </Button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#222222] bg-[#141414] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create New Wallet</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Add a new account or source of money.
            </p>
            
            <form onSubmit={handleCreateWallet} className="mt-4 space-y-4">
              {error && (
                <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/50 p-2.5 rounded-lg">
                  {error}
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-neutral-400">Wallet Name</label>
                <Input
                  placeholder="e.g. Cash, Visa Card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 border-[#222222] bg-[#0f0f0f] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400">Initial Balance</label>
                  <Input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="mt-1 border-[#222222] bg-[#0f0f0f] text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-400">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-[#222222] bg-[#0f0f0f] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#6EB38B]"
                  >
                    <option value="VND">VND (đ)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsOpen(false);
                    setError("");
                  }}
                  className="text-neutral-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1F4D36] text-white hover:bg-[#2e7451]"
                >
                  Create Wallet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
