import { useMemo } from 'react';
import { useBudgetStore } from '@store/budgetStore';
import type { Budget } from '@store/types';
import type { BudgetSummary } from '../types';

interface UseBudgetsReturn {
  data:      Budget[];
  isLoading: false;
  isError:   false;
  isEmpty:   boolean;
  error:     null;
  summary:   BudgetSummary | null;
  refresh:   () => void;
}

export function useBudgets(): UseBudgetsReturn {
  const budgets = useBudgetStore((s) => s.budgets);

  const summary = useMemo<BudgetSummary | null>(() => {
    if (budgets.length === 0) return null;
    const totalLimit      = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent      = budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgets.filter((b) => b.spent > b.limit).length;
    return {
      totalLimit,
      totalSpent,
      remaining:    totalLimit - totalSpent,
      percentUsed:  totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      overBudgetCount,
    };
  }, [budgets]);

  return {
    data:      budgets,
    isLoading: false,
    isError:   false,
    isEmpty:   budgets.length === 0,
    error:     null,
    summary,
    refresh:   () => {},
  };
}
