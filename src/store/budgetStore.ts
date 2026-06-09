import { create } from 'zustand';
import type { Budget } from './types';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  // Actions
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  updateSpent: (id: string, spent: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],
  isLoading: false,
  isError: false,
  error: null,

  setBudgets: (budgets) =>
    set({ budgets, isLoading: false, isError: false, error: null }),

  addBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),

  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  deleteBudget: (id) =>
    set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),

  updateSpent: (id, spent) =>
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === id ? { ...b, spent } : b)),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isError: error !== null, isLoading: false }),
}));
