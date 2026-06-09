import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchBudgets } from '../services/budgetService';
import { useBudgetStore } from '@store/budgetStore';
import type { AsyncState, Budget } from '@store/types';
import { createAsyncState } from '@store/types';
import type { BudgetSummary } from '../types';

interface UseBudgetsReturn extends AsyncState<Budget[]> {
  summary: BudgetSummary | null;
  refresh: () => Promise<void>;
}

export function useBudgets(): UseBudgetsReturn {
  const [state, setState] = useState<AsyncState<Budget[]>>(
    createAsyncState({ isLoading: true })
  );

  const budgets = useBudgetStore((s) => s.budgets);
  const setBudgets = useBudgetStore((s) => s.setBudgets);

  const load = useCallback(async () => {
    setState(createAsyncState({ isLoading: true }));
    try {
      const data = await fetchBudgets();
      setBudgets(data);
      setState({ data, isLoading: false, isError: false, isEmpty: data.length === 0, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load budgets';
      setState({ data: null, isLoading: false, isError: true, isEmpty: true, error: message });
    }
  }, [setBudgets]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo<BudgetSummary | null>(() => {
    if (budgets.length === 0) return null;
    const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;
    return {
      totalLimit,
      totalSpent,
      remaining: totalLimit - totalSpent,
      percentUsed: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      overBudgetCount,
    };
  }, [budgets]);

  return {
    data: budgets,
    isLoading: state.isLoading,
    isError: state.isError,
    isEmpty: budgets.length === 0,
    error: state.error,
    summary,
    refresh: load,
  };
}
