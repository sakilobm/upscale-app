import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import type { Transaction, NewTransaction, TransactionType, TransactionCategory } from './types';
import { MOCK_TRANSACTIONS } from '@features/dashboard/services/dashboardService';

export interface TransactionFilters {
  type: TransactionType | 'all';
  category: TransactionCategory | 'all';
  month: string | null;      // 'YYYY-MM'
  accountId: string | null;
  searchQuery: string;
}

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilters;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<NewTransaction>) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const DEFAULT_FILTERS: TransactionFilters = {
  type: 'all',
  category: 'all',
  month: null,
  accountId: null,
  searchQuery: '',
};

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS,
      filters: DEFAULT_FILTERS,
      isLoading: false,
      isError: false,
      error: null,

      setTransactions: (transactions) =>
        set({ transactions, isLoading: false, isError: false, error: null }),

      addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isError: error !== null, isLoading: false }),

      reset: () => set({ transactions: [], filters: DEFAULT_FILTERS }),
    }),
    {
      name: 'wc-transactions',
      storage: zustandStorage,
      partialize: (s) => ({ transactions: s.transactions }),
    }
  )
);
