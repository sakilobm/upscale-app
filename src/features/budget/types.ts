import type { Budget } from '@store/types';

export interface BudgetCardProps {
  budget: Budget;
  onPress: (budget: Budget) => void;
}

export interface BudgetSummary {
  totalLimit: number;
  totalSpent: number;
  remaining: number;
  percentUsed: number;
  overBudgetCount: number;
}
