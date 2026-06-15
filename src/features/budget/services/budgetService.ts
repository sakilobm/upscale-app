import type { Budget } from '@store/types';

export function buildBudget(
  data: Omit<Budget, 'id' | 'userId'>,
): Budget {
  return {
    ...data,
    id:     `bud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: 'local',
  };
}
