import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAllTransactions, createTransaction, deleteTransaction } from '../services/transactionService';
import { useTransactionStore } from '@store/transactionStore';
import type { Transaction, NewTransaction, AsyncState } from '@store/types';
import { createAsyncState } from '@store/types';
import type { TransactionGroupHeader } from '../types';
import { format, isToday, isYesterday } from 'date-fns';

function buildBalanceLookup(
  allTransactions: Transaction[],
  accountId?: string | null,
): Map<string, number> {
  // Optionally scope to a single account so per-account balance is accurate.
  const src = accountId
    ? allTransactions.filter((t) => t.accountId === accountId)
    : allTransactions;
  const sorted = [...src].sort((a, b) => a.date.localeCompare(b.date));
  const lookup = new Map<string, number>();
  let running = 0;
  for (const tx of sorted) {
    running += tx.type === 'income' ? tx.amount : -tx.amount;
    lookup.set(tx.date.slice(0, 10), running);
  }
  return lookup;
}

function groupTransactionsByDate(
  transactions: Transaction[],
  balanceLookup: Map<string, number>,
): TransactionGroupHeader[] {
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const dateKey = tx.date.slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    groups.set(dateKey, [...existing, tx]);
  }

  return Array.from(groups.entries()).map(([date, txs]) => ({
    date,
    totalAmount: txs.reduce(
      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
      0
    ),
    balanceAfter: balanceLookup.get(date) ?? 0,
    transactions: txs,
  }));
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

interface UseTransactionsReturn extends AsyncState<TransactionGroupHeader[]> {
  refresh: () => Promise<void>;
  addTransaction: (data: NewTransaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  formatDateHeader: (date: string) => string;
}

export function useTransactions(): UseTransactionsReturn {
  const [state, setState] = useState<AsyncState<Transaction[]>>(
    createAsyncState({ isLoading: true })
  );

  const storeTransactions = useTransactionStore((s) => s.transactions);
  const filters = useTransactionStore((s) => s.filters);
  const storeSetTransactions = useTransactionStore((s) => s.setTransactions);
  const storeAdd = useTransactionStore((s) => s.addTransaction);
  const storeDelete = useTransactionStore((s) => s.deleteTransaction);

  const load = useCallback(async () => {
    setState(createAsyncState({ isLoading: true }));
    try {
      const data = await fetchAllTransactions();
      storeSetTransactions(data);
      setState({ data, isLoading: false, isError: false, isEmpty: data.length === 0, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load transactions';
      setState({ data: null, isLoading: false, isError: true, isEmpty: true, error: message });
    }
  }, [storeSetTransactions]);

  useEffect(() => { load(); }, [load]);

  const addTransaction = useCallback(async (data: NewTransaction) => {
    try {
      const tx = await createTransaction(data);
      storeAdd(tx);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create transaction');
    }
  }, [storeAdd]);

  const removeTransaction = useCallback(async (id: string) => {
    try {
      await deleteTransaction(id);
      storeDelete(id);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete transaction');
    }
  }, [storeDelete]);

  const filtered = useMemo(() => {
    let txs = storeTransactions;
    if (filters.type !== 'all') txs = txs.filter((t) => t.type === filters.type);
    if (filters.category !== 'all') txs = txs.filter((t) => t.category === filters.category);
    if (filters.month) txs = txs.filter((t) => t.date.startsWith(filters.month!));
    if (filters.accountId) txs = txs.filter((t) => t.accountId === filters.accountId);
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return txs;
  }, [storeTransactions, filters]);

  // Balance lookup is scoped to the active account when one is selected.
  const balanceLookup = useMemo(
    () => buildBalanceLookup(storeTransactions, filters.accountId),
    [storeTransactions, filters.accountId],
  );

  const grouped = useMemo(
    () => groupTransactionsByDate(filtered, balanceLookup),
    [filtered, balanceLookup],
  );

  return {
    data: grouped,
    isLoading: state.isLoading,
    isError: state.isError,
    isEmpty: grouped.length === 0,
    error: state.error,
    refresh: load,
    addTransaction,
    removeTransaction,
    formatDateHeader,
  };
}
