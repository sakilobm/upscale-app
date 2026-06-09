import type { Transaction, NewTransaction } from '@store/types';
import { MOCK_TRANSACTIONS } from '@features/dashboard/services/dashboardService';

let _transactions: Transaction[] = [...MOCK_TRANSACTIONS];

export async function fetchAllTransactions(): Promise<Transaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [..._transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function createTransaction(data: NewTransaction): Promise<Transaction> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const transaction: Transaction = {
    ...data,
    id: `tx-${Date.now()}`,
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  _transactions = [transaction, ..._transactions];
  return transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  _transactions = _transactions.filter((t) => t.id !== id);
}
