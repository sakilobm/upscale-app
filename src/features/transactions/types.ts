import type { Transaction, TransactionType, TransactionCategory } from '@store/types';

export interface TransactionListItemProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
  balanceAfter?: number;
}

export interface FilterBarProps {
  activeType: TransactionType | 'all';
  onTypeChange: (type: TransactionType | 'all') => void;
}

export interface TransactionGroupHeader {
  date: string;
  totalAmount: number;
  balanceAfter: number;   // cumulative balance at end of this day (all tx, no filter)
  transactions: Transaction[];
}

export interface CategoryFilterOption {
  category: TransactionCategory | 'all';
  label: string;
  emoji: string;
}
