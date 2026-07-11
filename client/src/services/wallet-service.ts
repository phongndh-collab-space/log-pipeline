import { apiRequest } from "@/src/services/api";
import type { Wallet, CreateWalletPayload } from "@/src/types/finance";

export const walletService = {
  getWallets(token: string) {
    return apiRequest<Wallet[]>("/wallets", {
      method: "GET",
      token,
    });
  },

  createWallet(payload: CreateWalletPayload, token: string) {
    return apiRequest<Wallet>("/wallets", {
      method: "POST",
      body: JSON.stringify(payload),
      token,
    });
  },

  deleteWallet(id: number, token: string) {
    return apiRequest<Wallet>(`/wallets/${id}`, {
      method: "DELETE",
      token,
    });
  },
};
