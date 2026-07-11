import { create } from "zustand";
import { walletService } from "@/src/services/wallet-service";
import { categoryService } from "@/src/services/category-service";
import { transactionService } from "@/src/services/transaction-service";
import type {
  Wallet,
  Category,
  Transaction,
  CreateWalletPayload,
  CreateTransactionPayload,
  CreateCategoryPayload,
} from "@/src/types/finance";

type FinanceState = {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  fetchFinanceData: (token: string) => Promise<void>;
  createWallet: (payload: CreateWalletPayload, token: string) => Promise<void>;
  deleteWallet: (id: number, token: string) => Promise<void>;
  createCategory: (payload: CreateCategoryPayload, token: string) => Promise<void>;
  createTransaction: (payload: CreateTransactionPayload, token: string) => Promise<void>;
  deleteTransaction: (id: number, token: string) => Promise<void>;
};

function ensureList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const useFinanceStore = create<FinanceState>((set) => ({
  wallets: [],
  categories: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchFinanceData: async (token) => {
    set({ isLoading: true, error: null });
    try {
      const [wallets, categories, transactions] = await Promise.all([
        walletService.getWallets(token),
        categoryService.getCategories(token),
        transactionService.getTransactions(token),
      ]);
      set({
        wallets: ensureList(wallets),
        categories: ensureList(categories),
        transactions: ensureList(transactions),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch financial data",
        isLoading: false,
      });
    }
  },

  createWallet: async (payload, token) => {
    set({ isLoading: true, error: null });
    try {
      const newWallet = await walletService.createWallet(payload, token);
      set((state) => ({
        wallets: [newWallet, ...state.wallets],
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create wallet",
        isLoading: false,
      });
      throw err;
    }
  },

  deleteWallet: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      await walletService.deleteWallet(id, token);
      // Delete wallet and re-fetch because transactions might have been cascaded deleted
      const [wallets, transactions] = await Promise.all([
        walletService.getWallets(token),
        transactionService.getTransactions(token),
      ]);
      set({
        wallets: ensureList(wallets),
        transactions: ensureList(transactions),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete wallet",
        isLoading: false,
      });
      throw err;
    }
  },

  createCategory: async (payload, token) => {
    set({ isLoading: true, error: null });
    try {
      const newCategory = await categoryService.createCategory(payload, token);
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create category",
        isLoading: false,
      });
      throw err;
    }
  },

  createTransaction: async (payload, token) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.createTransaction(payload, token);
      // Re-fetch wallets and transactions to ensure balance updates are fully synced
      const [wallets, transactions] = await Promise.all([
        walletService.getWallets(token),
        transactionService.getTransactions(token),
      ]);
      set({
        wallets: ensureList(wallets),
        transactions: ensureList(transactions),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create transaction",
        isLoading: false,
      });
      throw err;
    }
  },

  deleteTransaction: async (id, token) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.deleteTransaction(id, token);
      // Re-fetch wallets and transactions to ensure balances revert correctly
      const [wallets, transactions] = await Promise.all([
        walletService.getWallets(token),
        transactionService.getTransactions(token),
      ]);
      set({
        wallets: ensureList(wallets),
        transactions: ensureList(transactions),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete transaction",
        isLoading: false,
      });
      throw err;
    }
  },
}));
