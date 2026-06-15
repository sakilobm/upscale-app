import type {
  Transaction,
  Account,
  MonthSummary,
  SpendingByCategory,
  CurrencyCode,
} from '@store/types';

export interface DashboardViewModel {
  totalBalance: number;
  monthSummary: MonthSummary;
  spendingByCategory: SpendingByCategory[];
  recentTransactions: Transaction[];
  accounts: Account[];
}

export interface BalanceCardProps {
  totalBalance: number;
  monthSummary: MonthSummary;
  isLoading: boolean;
  currency: CurrencyCode;
}

export interface QuickStatCardProps {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'savings';
  iconEmoji: string;
  currency: CurrencyCode;
}

export interface SpendingChartProps {
  data: SpendingByCategory[];
  isLoading: boolean;
}

export interface AccountCardProps {
  account: Account;
  isActive: boolean;
  onPress: () => void;
}
