import type { Budget } from '@store/types';

const MOCK_BUDGETS: Budget[] = [
  {
    id: 'bud-1', userId: 'user-1', category: 'housing',
    limit: 2000, spent: 1800, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#6C63FF',
  },
  {
    id: 'bud-2', userId: 'user-1', category: 'food',
    limit: 500, spent: 84.50, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#FB923C',
  },
  {
    id: 'bud-3', userId: 'user-1', category: 'transport',
    limit: 200, spent: 35, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#38BDF8',
  },
  {
    id: 'bud-4', userId: 'user-1', category: 'entertainment',
    limit: 100, spent: 18.99, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#EC4899',
  },
  {
    id: 'bud-5', userId: 'user-1', category: 'health',
    limit: 150, spent: 120, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#10B981',
  },
  {
    id: 'bud-6', userId: 'user-1', category: 'shopping',
    limit: 200, spent: 249.99, currency: 'USD', period: 'monthly',
    startDate: '2026-06-01', endDate: '2026-06-30', color: '#F59E0B',
  },
];

export async function fetchBudgets(): Promise<Budget[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_BUDGETS;
}
