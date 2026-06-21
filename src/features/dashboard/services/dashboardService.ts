/**
 * @file dashboardService.ts
 * @description Pure computation helpers used by useDashboardData.
 *   No mock data — all data comes from the real stores.
 */

import type {
  Transaction,
  MonthSummary,
  SpendingByCategory,
  TransactionCategory,
} from '@store/types';

// ─── Computation helpers ──────────────────────────────────────────────────────

const getSource = (tx: Transaction) => tx.source || 
  (tx.id.startsWith('tx-ledger-') ? 'ledger' : 
   tx.id.startsWith('tx-settled-') ? 'budget' : 'general');

export function computeSpendingByCategory(transactions: Transaction[]): SpendingByCategory[] {
  const expenses = transactions.filter((t) => t.type === 'expense' && getSource(t) !== 'ledger');
  const total    = expenses.reduce((sum, t) => sum + t.amount, 0);

  const byCategory: Partial<Record<TransactionCategory, number>> = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category:         category as TransactionCategory,
      amount:           amount ?? 0,
      percentage:       total > 0 ? ((amount ?? 0) / total) * 100 : 0,
      transactionCount: expenses.filter((t) => t.category === category).length,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeMonthSummary(transactions: Transaction[], month: string): MonthSummary {
  const monthTx    = transactions.filter((t) => t.date.startsWith(month) && getSource(t) !== 'ledger');
  const totalIncome  = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return {
    month,
    totalIncome,
    totalExpense,
    netSavings:       totalIncome - totalExpense,
    transactionCount: monthTx.length,
  };
}
