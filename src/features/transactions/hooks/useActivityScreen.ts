/**
 * @file useActivityScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Aggregates all data for the Transactions/Activity screen: monthly
 *   income/expense summary, selected account for the balance pill, formatted month
 *   label, and filter state. The View layer reads a single typed contract.
 * @associatedFiles src/features/transactions/hooks/useTransactions.ts,
 *   src/store/transactionStore.ts, src/store/accountStore.ts, src/app/(tabs)/transactions.tsx
 */

import { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useTransactions } from './useTransactions';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import type { Transaction, Account } from '@store/types';

export interface ActivitySummary {
  income:  number;
  expense: number;
  count:   number;
}

export function useActivityScreen() {
  const { data: groups, isLoading, isEmpty, refresh, removeTransaction, formatDateHeader } = useTransactions();

  const accounts   = useAccountStore((s) => s.accounts);
  const filters    = useTransactionStore((s) => s.filters);
  const setFilters = useTransactionStore((s) => s.setFilters);

  const selectedAccount: Account | null = filters.accountId
    ? (accounts.find((a) => a.id === filters.accountId) ?? null)
    : null;

  const summary = useMemo<ActivitySummary>(() => {
    const allTxs = (groups ?? []).flatMap((g) => g.transactions);
    return {
      income:  allTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: allTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      count:   allTxs.length,
    };
  }, [groups]);

  const monthLabel = filters.month
    ? format(new Date(filters.month + '-01'), 'MMMM yyyy')
    : format(new Date(), 'MMMM yyyy');

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleTransactionPress = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    groups, isLoading, isEmpty, refresh, removeTransaction, formatDateHeader,
    accounts, filters, setFilters,
    selectedAccount,
    summary,
    monthLabel,
    editingTransaction,
    setEditingTransaction,
    handleTransactionPress,
  };
}
