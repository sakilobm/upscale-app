import type {
  DashboardData,
  Transaction,
  Account,
  MonthSummary,
  SpendingByCategory,
  TransactionCategory,
} from '@store/types';

// ─── Seed Data ───────────────────────────────────────────────────────────────

const MOCK_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    userId: 'user-1',
    name: 'Main Checking',
    type: 'checking',
    balance: 12485.50,
    currency: 'USD',
    color: '#6C63FF',
    icon: '💳',
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    userId: 'user-1',
    name: 'Savings',
    type: 'savings',
    balance: 28320.00,
    currency: 'USD',
    color: '#10B981',
    icon: '🏦',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'acc-3',
    userId: 'user-1',
    name: 'Investments',
    type: 'investment',
    balance: 54100.75,
    currency: 'USD',
    color: '#38BDF8',
    icon: '📈',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1', userId: 'user-1', type: 'income', category: 'salary',
    amount: 5500, currency: 'USD', description: 'Monthly Salary', note: null,
    date: '2026-06-01T09:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-01T09:00:00Z', updatedAt: '2026-06-01T09:00:00Z',
  },
  {
    id: 'tx-2', userId: 'user-1', type: 'expense', category: 'housing',
    amount: 1800, currency: 'USD', description: 'Rent Payment', note: null,
    date: '2026-06-02T10:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-02T10:00:00Z', updatedAt: '2026-06-02T10:00:00Z',
  },
  {
    id: 'tx-3', userId: 'user-1', type: 'expense', category: 'food',
    amount: 84.50, currency: 'USD', description: 'Grocery Store', note: null,
    date: '2026-06-03T14:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-03T14:00:00Z', updatedAt: '2026-06-03T14:00:00Z',
  },
  {
    id: 'tx-4', userId: 'user-1', type: 'expense', category: 'transport',
    amount: 35.00, currency: 'USD', description: 'Uber Ride', note: null,
    date: '2026-06-04T18:30:00Z', accountId: 'acc-1',
    createdAt: '2026-06-04T18:30:00Z', updatedAt: '2026-06-04T18:30:00Z',
  },
  {
    id: 'tx-5', userId: 'user-1', type: 'income', category: 'freelance',
    amount: 1200, currency: 'USD', description: 'Freelance Project', note: null,
    date: '2026-06-05T11:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-05T11:00:00Z', updatedAt: '2026-06-05T11:00:00Z',
  },
  {
    id: 'tx-6', userId: 'user-1', type: 'expense', category: 'entertainment',
    amount: 18.99, currency: 'USD', description: 'Netflix Subscription', note: null,
    date: '2026-06-06T00:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-06T00:00:00Z', updatedAt: '2026-06-06T00:00:00Z',
  },
  {
    id: 'tx-7', userId: 'user-1', type: 'expense', category: 'health',
    amount: 120.00, currency: 'USD', description: 'Gym Membership', note: null,
    date: '2026-06-07T07:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-07T07:00:00Z', updatedAt: '2026-06-07T07:00:00Z',
  },
  {
    id: 'tx-8', userId: 'user-1', type: 'expense', category: 'shopping',
    amount: 249.99, currency: 'USD', description: 'Amazon Order', note: null,
    date: '2026-06-08T15:00:00Z', accountId: 'acc-1',
    createdAt: '2026-06-08T15:00:00Z', updatedAt: '2026-06-08T15:00:00Z',
  },
];

// ─── Computation helpers ─────────────────────────────────────────────────────

function computeSpendingByCategory(transactions: Transaction[]): SpendingByCategory[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  const byCategory: Partial<Record<TransactionCategory, number>> = {};
  for (const t of expenses) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  return Object.entries(byCategory)
    .map(([category, amount]) => ({
      category: category as TransactionCategory,
      amount: amount ?? 0,
      percentage: total > 0 ? ((amount ?? 0) / total) * 100 : 0,
      transactionCount: expenses.filter((t) => t.category === category).length,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function computeMonthSummary(transactions: Transaction[], month: string): MonthSummary {
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const totalIncome = monthTx
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    month,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    transactionCount: monthTx.length,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const totalBalance = MOCK_ACCOUNTS.reduce((sum, a) => sum + a.balance, 0);
  const currentMonth = '2026-06';
  const monthSummary = computeMonthSummary(MOCK_TRANSACTIONS, currentMonth);
  const spendingByCategory = computeSpendingByCategory(MOCK_TRANSACTIONS);
  const recentTransactions = [...MOCK_TRANSACTIONS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    totalBalance,
    monthSummary,
    spendingByCategory,
    recentTransactions,
    accounts: MOCK_ACCOUNTS,
  };
}

export { MOCK_TRANSACTIONS, MOCK_ACCOUNTS };
