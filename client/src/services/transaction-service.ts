import { apiRequest } from "@/src/services/api";
import type { Transaction, CreateTransactionPayload } from "@/src/types/finance";

export const transactionService = {
  getTransactions(token: string) {
    return apiRequest<Transaction[]>("/transactions", {
      method: "GET",
      token,
    });
  },

  createTransaction(payload: CreateTransactionPayload, token: string) {
    return apiRequest<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  deleteTransaction(id: number, token: string) {
    return apiRequest<Transaction>(`/transactions/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
