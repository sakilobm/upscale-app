import { useMemo } from 'react';
import { useBudgetStore } from '@store/budgetStore';
import { useTransactionStore } from '@store/transactionStore';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { useCategoryStore } from '@store/categoryStore';
import { format } from 'date-fns';
import type { Budget } from '@store/types';
import type { BudgetSummary } from '../types';

export interface SpendingStats {
  category:  string;
  label:     string;
  icon:      string;
  color:     string;
  spent:     number;
  scheduled: number;
  limit:     number;
  remaining: number;
  percent:   number;
  hasLimit:  boolean;
  budgetId:  string | null;
}

interface UseBudgetsReturn {
  data:      Budget[];
  isLoading: false;
  isError:   false;
  isEmpty:   boolean;
  error:     null;
  summary:   BudgetSummary | null;
  refresh:   () => void;
  deleteBudget: (id: string) => void;
  spendingBreakdown: SpendingStats[];
}

export function useBudgets(): UseBudgetsReturn {
  const budgets = useBudgetStore((s) => s.budgets);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const transactions = useTransactionStore((s) => s.transactions);
  const categories = useCategoryStore((s) => s.categories);
  const plannedPayments = usePlannedPaymentsStore((s) => s.payments);

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

  // Calculate full category spending breakdown (limits + actual spent + planned upcoming)
  const spendingBreakdown = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const getSource = (tx: any) => tx.source || 
      (tx.id.startsWith('tx-ledger-') ? 'ledger' : 
       tx.id.startsWith('tx-settled-') ? 'budget' : 'general');
    
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(currentMonth) && getSource(t) !== 'ledger'
    );

    // Identify active categories (has budget limit OR has transaction spent OR has remaining planned payment)
    const activeCatIds = new Set<string>();
    budgets.forEach((b) => activeCatIds.add(b.category));
    monthExpenses.forEach((t) => activeCatIds.add(t.category));
    plannedPayments.forEach((p) => {
      if (p.status !== 'SETTLED') {
        activeCatIds.add(p.category);
      }
    });

    return Array.from(activeCatIds).map((catId) => {
      const catDef = categories.find((c) => c.id === catId) || {
        id: catId,
        label: catId.charAt(0).toUpperCase() + catId.slice(1),
        icon: 'cube',
        color: '#94A3B8'
      };

      const budget = budgetsWithSpent.find((b) => b.category === catId) || null;
      const limit = budget ? budget.limit : 0;
      const spent = budget ? budget.spent : monthExpenses
        .filter((t) => t.category === catId)
        .reduce((sum, t) => sum + t.amount, 0);

      const scheduled = plannedPayments
        .filter((p) => p.category === catId && p.status !== 'SETTLED')
        .reduce((sum, p) => sum + (p.amount - (p.amountPaid ?? 0)), 0);

      const remaining = limit > 0 ? Math.max(limit - spent, 0) : 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        category: catId,
        label: catDef.label,
        icon: catDef.icon,
        color: budget?.color || catDef.color,
        spent,
        scheduled,
        limit,
        remaining,
        percent,
        hasLimit: limit > 0,
        budgetId: budget?.id || null
      };
    });
  }, [budgetsWithSpent, transactions, plannedPayments, categories, budgets]);

  return {
    data:      budgetsWithSpent,
    isLoading: false,
    isError:   false,
    isEmpty:   budgetsWithSpent.length === 0,
    error:     null,
    summary,
    refresh:   () => {},
    deleteBudget,
    spendingBreakdown,
  };
}
