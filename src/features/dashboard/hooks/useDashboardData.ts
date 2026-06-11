import { useState, useEffect, useCallback } from 'react';
import { fetchDashboardData, MOCK_TRANSACTIONS } from '../services/dashboardService';
import { useTransactionStore } from '@store/transactionStore';
import type { DashboardViewModel } from '../types';
import type { AsyncState } from '@store/types';
import { createAsyncState } from '@store/types';

type UseDashboardDataReturn = AsyncState<DashboardViewModel> & {
  refresh: () => Promise<void>;
};

export function useDashboardData(): UseDashboardDataReturn {
  const [state, setState] = useState<AsyncState<DashboardViewModel>>(
    createAsyncState({ isLoading: true })
  );

  const setTransactions = useTransactionStore((s) => s.setTransactions);

  const load = useCallback(async () => {
    setState(createAsyncState({ isLoading: true }));

    try {
      const dashboard = await fetchDashboardData();

      // Seed transaction store with all mock data (only if empty, to preserve user additions)
      setTransactions(MOCK_TRANSACTIONS);

      const vm: DashboardViewModel = {
        totalBalance: dashboard.totalBalance,
        monthSummary: dashboard.monthSummary,
        spendingByCategory: dashboard.spendingByCategory,
        recentTransactions: dashboard.recentTransactions,
        accounts: dashboard.accounts,
      };

      setState({
        data: vm,
        isLoading: false,
        isError: false,
        isEmpty: dashboard.recentTransactions.length === 0,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard';
      setState({
        data: null,
        isLoading: false,
        isError: true,
        isEmpty: true,
        error: message,
      });
    }
  }, [setTransactions]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
