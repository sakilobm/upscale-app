// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currency: CurrencyCode;
  createdAt: string;
}

// ─── Money primitives ────────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'CAD' | 'AUD';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
};

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory =
  | 'housing'
  | 'food'
  | 'transport'
  | 'health'
  | 'entertainment'
  | 'shopping'
  | 'education'
  | 'savings'
  | 'investment'
  | 'salary'
  | 'freelance'
  | 'gift'
  | 'other';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: CurrencyCode;
  description: string;
  note: string | null;
  date: string;           // ISO 8601
  accountId: string;
  createdAt: string;
  updatedAt: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// ─── Accounts ────────────────────────────────────────────────────────────────

export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: CurrencyCode;
  color: string;
  icon: string;
  isDefault: boolean;
  createdAt: string;
}

// ─── Budgets ─────────────────────────────────────────────────────────────────

export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  limit: number;
  spent: number;
  currency: CurrencyCode;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  color: string;
}

// ─── Dashboard / Analytics ───────────────────────────────────────────────────

export interface MonthSummary {
  month: string;            // 'YYYY-MM'
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactionCount: number;
}

export interface SpendingByCategory {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface DashboardData {
  totalBalance: number;
  monthSummary: MonthSummary;
  spendingByCategory: SpendingByCategory[];
  recentTransactions: Transaction[];
  accounts: Account[];
}

// ─── UI primitives ───────────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: string | null;
}

export function createAsyncState<T>(overrides?: Partial<AsyncState<T>>): AsyncState<T> {
  return {
    data: null,
    isLoading: false,
    isError: false,
    isEmpty: true,
    error: null,
    ...overrides,
  };
}
