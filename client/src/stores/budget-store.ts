"use client";

import { create } from "zustand";

type BudgetMode = "monthly" | "weekly";

type BudgetStore = {
  mode: BudgetMode;
  setMode: (mode: BudgetMode) => void;
};

export const useBudgetStore = create<BudgetStore>((set) => ({
  mode: "monthly",
  setMode: (mode) => set({ mode }),
}));
