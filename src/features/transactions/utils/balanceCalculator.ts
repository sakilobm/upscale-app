import type { Transaction, Account } from '@store/types';
import { addMoney, subtractMoney } from '@/utils/moneyMath';

/**
 * Calculates the running balance for every transaction per account.
 * Starts from the current account balance and works backwards chronologically
 * to determine the balance immediately following each transaction.
 * 
 * @param transactions All transactions in the store
 * @param accounts All accounts in the store
 * @returns A Map of transaction ID to the post-transaction running balance of its primary account.
 */
export function calculateRunningBalances(
  transactions: Transaction[],
  accounts: Account[]
): Map<string, number> {
  const runningBalances = new Map<string, number>();

  for (const account of accounts) {
    // Filter transactions relevant to this account (either source or destination)
    const accTxs = transactions.filter(
      (t) => t.accountId === account.id || t.toAccountId === account.id
    );

    // Sort chronologically (ascending, oldest first)
    const sortedTxs = [...accTxs].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      const cmpCreated = a.createdAt.localeCompare(b.createdAt);
      if (cmpCreated !== 0) return cmpCreated;
      return a.id.localeCompare(b.id);
    });

    // Mock running balance pass starting at 0
    let mockRunning = 0;
    const mockBalancesAfterTx = new Map<string, number>();

    for (const tx of sortedTxs) {
      if (tx.accountId === account.id) {
        if (tx.type === 'income') {
          mockRunning = addMoney(mockRunning, tx.amount);
        } else {
          // expense or transfer (transfer is outgoing from accountId)
          mockRunning = subtractMoney(mockRunning, tx.amount);
        }
      } else if (tx.toAccountId === account.id) {
        // Transfer destination (incoming to toAccountId)
        mockRunning = addMoney(mockRunning, tx.amount);
      }
      mockBalancesAfterTx.set(tx.id, mockRunning);
    }

    // Since mockRunning is the final balance starting from 0, the offset to the actual current balance is:
    const offset = subtractMoney(account.balance, mockRunning);

    // Map each transaction's mock balance back to the real balance after applying the offset
    for (const tx of sortedTxs) {
      const mockBal = mockBalancesAfterTx.get(tx.id) ?? 0;
      const realBal = addMoney(mockBal, offset);
      
      // We only store the running balance from the perspective of the transaction's primary accountId
      if (tx.accountId === account.id) {
        runningBalances.set(tx.id, realBal);
      }
    }
  }

  return runningBalances;
}
