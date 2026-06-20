import { useMemo } from 'react';
import { useBudgetStore } from '@store/budgetStore';
import { useTransactionStore } from '@store/transactionStore';
import { format } from 'date-fns';
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
  deleteBudget: (id: string) => void;
}

export function useBudgets(): UseBudgetsReturn {
  const budgets = useBudgetStore((s) => s.budgets);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const transactions = useTransactionStore((s) => s.transactions);

  const budgetsWithSpent = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const getSource = (tx: any) => tx.source || 
      (tx.id.startsWith('tx-ledger-') ? 'ledger' : 
       tx.id.startsWith('tx-settled-') ? 'budget' : 'general');
    
    // Sum general expenses and budget expenses in this category for the current month
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentMonth) && getSource(t) !== 'ledger'
    );

    return budgets.map((b) => {
      const spent = monthExpenses
        .filter((t) => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, transactions]);

  const summary = useMemo<BudgetSummary | null>(() => {
    if (budgetsWithSpent.length === 0) return null;
    const totalLimit      = budgetsWithSpent.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent      = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgetsWithSpent.filter((b) => b.spent > b.limit).length;
    return {
      totalLimit,
      totalSpent,
      remaining:    totalLimit - totalSpent,
      percentUsed:  totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
      overBudgetCount,
    };
  }, [budgetsWithSpent]);

  return {
    data:      budgetsWithSpent,
    isLoading: false,
    isError:   false,
    isEmpty:   budgetsWithSpent.length === 0,
    error:     null,
    summary,
    refresh:   () => {},
    deleteBudget,
  };
}
