/**
 * @file useAnalyticsScreen.ts
 * @architecture Feature Layer — Headless Logic Hook
 * @description Core analytics engine that aggregates data from all Zustand stores
 *   (transactions, budgets, loans, ledger, accounts) and computes weekly, monthly,
 *   and yearly summaries, growth rates, category breakdowns, cash-flow trends,
 *   and smart financial insights.
 */

import { useMemo, useState } from 'react';
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subWeeks,
  subYears,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isWithinInterval,
  differenceInDays,
} from 'date-fns';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import { useBudgetStore } from '@store/budgetStore';
import { useLoansStore } from '@store/loansStore';
import { useLedgerStore } from '@store/ledgerStore';
import { getCategoryById } from '@store/categoryStore';
import { useFormatCurrency } from '@hooks/useFormatCurrency';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PeriodMode = 'weekly' | 'monthly' | 'yearly';

export interface PeriodSummary {
  label:       string;
  income:      number;
  expense:     number;
  net:         number;
  txCount:     number;
}

export interface GrowthMetric {
  label:       string;
  current:     number;
  previous:    number;
  changePct:   number;
  direction:   'up' | 'down' | 'flat';
}

export interface CategorySlice {
  id:          string;
  label:       string;
  color:       string;
  amount:      number;
  percentage:  number;
  txCount:     number;
}

export interface CashFlowBar {
  label:   string;
  income:  number;
  expense: number;
  net:     number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface LoanSummary {
  totalBorrowed:    number;
  totalLent:        number;
  activeBorrowed:   number;
  activeLent:       number;
  borrowedCount:    number;
  lentCount:        number;
  monthlyEmi:       number;
}

export interface LedgerSummary {
  totalOwedToMe:    number;
  totalIOwe:        number;
  activeEntries:    number;
  overdueEntries:   number;
  settledEntries:   number;
}

export interface SmartInsight {
  id:    string;
  icon:  string;
  color: string;
  title: string;
  body:  string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalyticsScreen() {
  const [period, setPeriod] = useState<PeriodMode>('monthly');
  const [fullscreenChart, setFullscreenChart] = useState<'cashflow' | 'trend' | null>(null);

  const { symbol } = useFormatCurrency();

  const formatAmount = useMemo(() => (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000)     return `${symbol}${(n / 1_000).toFixed(1)}K`;
    return `${symbol}${n.toFixed(0)}`;
  }, [symbol]);

  const formatFull = useMemo(() => (n: number) =>
    `${symbol}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, [symbol]);

  const transactions = useTransactionStore((s) => s.transactions);
  const accounts     = useAccountStore((s) => s.accounts);
  const budgets      = useBudgetStore((s) => s.budgets);
  const loans        = useLoansStore((s) => s.loans);
  const ledger       = useLedgerStore((s) => s.entries);

  const now = new Date();

  // ── Period range computation ──────────────────────────────────────────────
  const { currentStart, currentEnd, prevStart, prevEnd } = useMemo(() => {
    switch (period) {
      case 'weekly': {
        const cs = startOfWeek(now, { weekStartsOn: 1 });
        const ce = endOfWeek(now, { weekStartsOn: 1 });
        const ps = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        const pe = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        return { currentStart: cs, currentEnd: ce, prevStart: ps, prevEnd: pe };
      }
      case 'monthly': {
        const cs = startOfMonth(now);
        const ce = endOfMonth(now);
        const ps = startOfMonth(subMonths(now, 1));
        const pe = endOfMonth(subMonths(now, 1));
        return { currentStart: cs, currentEnd: ce, prevStart: ps, prevEnd: pe };
      }
      case 'yearly': {
        const cs = startOfYear(now);
        const ce = endOfYear(now);
        const ps = startOfYear(subYears(now, 1));
        const pe = endOfYear(subYears(now, 1));
        return { currentStart: cs, currentEnd: ce, prevStart: ps, prevEnd: pe };
      }
    }
  }, [period]);

  // ── Filter transactions to period ─────────────────────────────────────────
  const currentTxs = useMemo(
    () => transactions.filter((t) => {
      try {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start: currentStart, end: currentEnd });
      } catch { return false; }
    }),
    [transactions, currentStart, currentEnd]
  );

  const prevTxs = useMemo(
    () => transactions.filter((t) => {
      try {
        const d = parseISO(t.date);
        return isWithinInterval(d, { start: prevStart, end: prevEnd });
      } catch { return false; }
    }),
    [transactions, prevStart, prevEnd]
  );

  // ── Aggregate income/expense for a tx set ─────────────────────────────────
  const aggregate = (txs: typeof transactions) => {
    let income = 0, expense = 0;
    txs.forEach((t) => {
      if (t.type === 'income')  income += t.amount;
      if (t.type === 'expense') expense += t.amount;
    });
    return { income, expense, net: income - expense, txCount: txs.length };
  };

  const currentAgg = useMemo(() => aggregate(currentTxs), [currentTxs]);
  const prevAgg    = useMemo(() => aggregate(prevTxs), [prevTxs]);

  // ── Growth metrics ────────────────────────────────────────────────────────
  const growthMetrics = useMemo<GrowthMetric[]>(() => {
    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return ((cur - prev) / prev) * 100;
    };
    const dir = (p: number) => (p > 1 ? 'up' : p < -1 ? 'down' : 'flat');

    const incomeGrowth  = pct(currentAgg.income, prevAgg.income);
    const expenseGrowth = pct(currentAgg.expense, prevAgg.expense);
    const savingsGrowth = pct(currentAgg.net, prevAgg.net);

    return [
      { label: 'Income',   current: currentAgg.income,  previous: prevAgg.income,  changePct: incomeGrowth,  direction: dir(incomeGrowth) },
      { label: 'Expenses', current: currentAgg.expense, previous: prevAgg.expense, changePct: expenseGrowth, direction: dir(expenseGrowth) },
      { label: 'Savings',  current: currentAgg.net,     previous: prevAgg.net,     changePct: savingsGrowth, direction: dir(savingsGrowth) },
    ];
  }, [currentAgg, prevAgg]);

  // ── Cash-flow bars (per sub-period) ───────────────────────────────────────
  const cashFlowBars = useMemo<CashFlowBar[]>(() => {
    if (period === 'weekly') {
      // 7 daily bars for the current week
      const bars: CashFlowBar[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(currentStart);
        day.setDate(day.getDate() + i);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayTxs = currentTxs.filter((t) => t.date.startsWith(dayStr));
        const { income, expense, net } = aggregate(dayTxs);
        bars.push({ label: format(day, 'EEE'), income, expense, net });
      }
      return bars;
    }

    if (period === 'monthly') {
      // 4-5 weekly bars for the current month
      const weeks = eachWeekOfInterval(
        { start: currentStart, end: currentEnd },
        { weekStartsOn: 1 }
      );
      return weeks.map((ws, i) => {
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        const weekTxs = currentTxs.filter((t) => {
          try {
            const d = parseISO(t.date);
            return isWithinInterval(d, { start: ws, end: we });
          } catch { return false; }
        });
        const { income, expense, net } = aggregate(weekTxs);
        return { label: `W${i + 1}`, income, expense, net };
      });
    }

    // Yearly: 12 monthly bars
    const months = eachMonthOfInterval({ start: currentStart, end: currentEnd });
    return months.map((ms) => {
      const me = endOfMonth(ms);
      const mTxs = currentTxs.filter((t) => {
        try {
          const d = parseISO(t.date);
          return isWithinInterval(d, { start: ms, end: me });
        } catch { return false; }
      });
      const { income, expense, net } = aggregate(mTxs);
      return { label: format(ms, 'MMM'), income, expense, net };
    });
  }, [period, currentTxs, currentStart, currentEnd]);

  // ── Savings trend line ────────────────────────────────────────────────────
  const savingsTrend = useMemo<TrendPoint[]>(() => {
    return cashFlowBars.map((b) => ({ label: b.label, value: b.net }));
  }, [cashFlowBars]);

  // ── Category breakdown (expense only) ─────────────────────────────────────
  const categoryBreakdown = useMemo<CategorySlice[]>(() => {
    const expTxs = currentTxs.filter((t) => t.type === 'expense');
    const totalExpense = expTxs.reduce((s, t) => s + t.amount, 0);
    if (totalExpense === 0) return [];

    const map: Record<string, { amount: number; count: number }> = {};
    expTxs.forEach((t) => {
      if (!map[t.category]) map[t.category] = { amount: 0, count: 0 };
      map[t.category].amount += t.amount;
      map[t.category].count += 1;
    });

    return Object.entries(map)
      .map(([catId, data]) => {
        const cat = getCategoryById(catId);
        return {
          id: catId,
          label: cat.label,
          color: cat.color,
          amount: data.amount,
          percentage: (data.amount / totalExpense) * 100,
          txCount: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [currentTxs]);

  // ── Total balance (net worth) ─────────────────────────────────────────────
  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts]
  );

  // ── Budget utilization ────────────────────────────────────────────────────
  const budgetUtilization = useMemo(() => {
    if (budgets.length === 0) return { totalLimit: 0, totalSpent: 0, pct: 0 };
    const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    return { totalLimit, totalSpent, pct: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0 };
  }, [budgets]);

  // ── Loan summary ──────────────────────────────────────────────────────────
  const loanSummary = useMemo<LoanSummary>(() => {
    let totalBorrowed = 0, totalLent = 0, activeBorrowed = 0, activeLent = 0;
    let borrowedCount = 0, lentCount = 0, monthlyEmi = 0;

    loans.forEach((l) => {
      const remaining = l.principalAmount - l.amountPaid;
      if (l.type === 'BORROWED') {
        totalBorrowed += l.principalAmount;
        if (remaining > 0) { activeBorrowed += remaining; borrowedCount++; monthlyEmi += l.emiAmount; }
      } else {
        totalLent += l.principalAmount;
        if (remaining > 0) { activeLent += remaining; lentCount++; }
      }
    });

    return { totalBorrowed, totalLent, activeBorrowed, activeLent, borrowedCount, lentCount, monthlyEmi };
  }, [loans]);

  // ── Ledger summary ────────────────────────────────────────────────────────
  const ledgerSummary = useMemo<LedgerSummary>(() => {
    let totalOwedToMe = 0, totalIOwe = 0;
    let activeEntries = 0, overdueEntries = 0, settledEntries = 0;

    ledger.forEach((e) => {
      const remaining = e.totalAmount - e.amountReturned;
      if (e.status === 'SETTLED') { settledEntries++; return; }
      if (e.status === 'OVERDUE') overdueEntries++;
      activeEntries++;
      if (e.direction === 'OWED_TO_ME') totalOwedToMe += remaining;
      else totalIOwe += remaining;
    });

    return { totalOwedToMe, totalIOwe, activeEntries, overdueEntries, settledEntries };
  }, [ledger]);

  // ── Smart Insights ────────────────────────────────────────────────────────
  const insights = useMemo<SmartInsight[]>(() => {
    const list: SmartInsight[] = [];

    // 1. Savings rate
    if (currentAgg.income > 0) {
      const savingsRate = (currentAgg.net / currentAgg.income) * 100;
      list.push({
        id: 'savings-rate',
        icon: savingsRate >= 20 ? 'trending-up' : 'trending-down',
        color: savingsRate >= 20 ? '#10B981' : '#F59E0B',
        title: `${savingsRate.toFixed(0)}% Savings Rate`,
        body: savingsRate >= 20
          ? 'Great! You\'re saving more than 20% of income.'
          : 'Try to save at least 20% of your income.',
      });
    }

    // 2. Top spending category
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      list.push({
        id: 'top-category',
        icon: 'pie-chart',
        color: top.color,
        title: `${top.label} dominates spending`,
        body: `${top.percentage.toFixed(0)}% of total expenses across ${top.txCount} transactions.`,
      });
    }

    // 3. Budget health
    if (budgetUtilization.totalLimit > 0) {
      const bPct = budgetUtilization.pct;
      list.push({
        id: 'budget-health',
        icon: bPct > 90 ? 'alert-circle' : 'checkmark-circle',
        color: bPct > 90 ? '#EF4444' : bPct > 70 ? '#F59E0B' : '#10B981',
        title: `Budget ${bPct.toFixed(0)}% utilized`,
        body: bPct > 90
          ? 'Warning: You\'re close to exceeding your budget limits.'
          : 'You\'re within healthy budget boundaries.',
      });
    }

    // 4. Expense growth alert
    const expGrowth = growthMetrics.find((m) => m.label === 'Expenses');
    if (expGrowth && Math.abs(expGrowth.changePct) > 15) {
      list.push({
        id: 'expense-growth',
        icon: expGrowth.direction === 'up' ? 'arrow-up-circle' : 'arrow-down-circle',
        color: expGrowth.direction === 'up' ? '#EF4444' : '#10B981',
        title: `Expenses ${expGrowth.direction === 'up' ? 'increased' : 'decreased'} ${Math.abs(expGrowth.changePct).toFixed(0)}%`,
        body: `Compared to last ${period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}.`,
      });
    }

    // 5. Overdue ledger entries
    if (ledgerSummary.overdueEntries > 0) {
      list.push({
        id: 'overdue-ledger',
        icon: 'time',
        color: '#EF4444',
        title: `${ledgerSummary.overdueEntries} overdue ${ledgerSummary.overdueEntries === 1 ? 'entry' : 'entries'}`,
        body: 'You have overdue ledger entries that need attention.',
      });
    }

    return list;
  }, [currentAgg, categoryBreakdown, budgetUtilization, growthMetrics, ledgerSummary, period]);

  // ── Period label ──────────────────────────────────────────────────────────
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'weekly':  return format(currentStart, 'MMM d') + ' – ' + format(currentEnd, 'MMM d, yyyy');
      case 'monthly': return format(currentStart, 'MMMM yyyy');
      case 'yearly':  return format(currentStart, 'yyyy');
    }
  }, [period, currentStart, currentEnd]);

  return {
    // State
    period,
    setPeriod,
    periodLabel,
    fullscreenChart,
    setFullscreenChart,

    // Formatting helpers
    formatAmount,
    formatFull,

    // Summaries
    currentAgg,
    prevAgg,
    totalBalance,

    // Charts
    growthMetrics,
    cashFlowBars,
    savingsTrend,
    categoryBreakdown,

    // Budget
    budgetUtilization,

    // Loans & Ledger
    loanSummary,
    ledgerSummary,

    // Intelligence
    insights,
  };
}
