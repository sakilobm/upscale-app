import type {
  Transaction,
  Account,
  MonthSummary,
  SpendingByCategory,
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
}

export interface QuickStatCardProps {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'savings';
  iconEmoji: string;
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
