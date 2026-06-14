import type { Transaction, NewTransaction } from '@store/types';

export function buildTransaction(data: NewTransaction): Transaction {
  return {
    ...data,
    id:        `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId:    'local',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
