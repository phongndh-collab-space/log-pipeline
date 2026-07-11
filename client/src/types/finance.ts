export type Wallet = {
  id: number;
  name: string;
  balance: number;
  currency: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
};

export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type Transaction = {
  id: number;
  amount: number;
  type: TransactionType;
  description: string | null;
  date: string;
  walletId: number;
  wallet: {
    id: number;
    name: string;
    currency: string;
  };
  toWalletId: number | null;
  toWallet: {
    id: number;
    name: string;
    currency: string;
  } | null;
  categoryId: number | null;
  category: {
    id: number;
    name: string;
    icon: string;
    color: string;
  } | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateWalletPayload = {
  name: string;
  balance?: number;
  currency?: string;
};

export type CreateCategoryPayload = {
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
};

export type CreateTransactionPayload = {
  amount: number;
  type: TransactionType;
  description?: string;
  date?: string;
  walletId: number;
  toWalletId?: number;
  categoryId?: number;
};
