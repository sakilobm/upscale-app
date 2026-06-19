import { useMemo } from 'react';
import { format } from 'date-fns';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import { computeMonthSummary, computeSpendingByCategory } from '../services/dashboardService';
import type { DashboardViewModel } from '../types';
import type { AsyncState } from '@store/types';
import { createAsyncState } from '@store/types';

type UseDashboardDataReturn = AsyncState<DashboardViewModel> & {
  refresh: () => Promise<void>;
};

export function useDashboardData(): UseDashboardDataReturn {
  const transactions = useTransactionStore((s) => s.transactions);
  const accounts = useAccountStore((s) => s.accounts);

  const vm = useMemo<DashboardViewModel>(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const totalBalance = accounts.reduce((sum, a) => sum + (a.type === 'credit' ? -a.balance : a.balance), 0);
    const monthSummary = computeMonthSummary(transactions, currentMonth);
    const spendingByCategory = computeSpendingByCategory(transactions);
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    return { totalBalance, monthSummary, spendingByCategory, recentTransactions, accounts };
  }, [transactions, accounts]);

  return {
    data: vm,
    isLoading: false,
    isError: false,
    isEmpty: transactions.length === 0 && accounts.length === 0,
    error: null,
    refresh: async () => {},
  };
}
