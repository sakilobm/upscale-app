import { useCallback, useMemo } from 'react';
import { buildTransaction } from '../services/transactionService';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import { useLoansStore } from '@store/loansStore';
import {
  scheduleReminderNotification,
  cancelScheduledReminder,
} from '@features/notifications/services/notificationService';
import { calculateRunningBalances } from '../utils/balanceCalculator';
import type { NewTransaction } from '@store/types';
import type { TransactionGroupHeader } from '../types';
import { format, isToday, isYesterday, addMonths, parseISO } from 'date-fns';
import { toast } from '@store/toastStore';
import { addMoney, subtractMoney } from '@/utils/moneyMath';

function buildBalanceLookup(
  transactions: ReturnType<typeof useTransactionStore.getState>['transactions'],
  accountId?: string | null,
): Map<string, number> {
  const src = accountId
    ? transactions.filter((t) => t.accountId === accountId)
    : transactions;
  const sorted = [...src].sort((a, b) => a.date.localeCompare(b.date));
  const lookup = new Map<string, number>();
  let running = 0;
  for (const tx of sorted) {
    running = tx.type === 'income' ? addMoney(running, tx.amount) : subtractMoney(running, tx.amount);
    lookup.set(tx.date.slice(0, 10), running);
  }
  return lookup;
}

function groupTransactionsByDate(
  transactions: ReturnType<typeof useTransactionStore.getState>['transactions'],
  balanceLookup: Map<string, number>,
): TransactionGroupHeader[] {
  const groups = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const key = tx.date.slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), tx]);
  }
  return Array.from(groups.entries()).map(([date, txs]) => ({
    date,
    totalAmount: txs.reduce(
      (sum, t) => t.type === 'income' ? addMoney(sum, t.amount) : subtractMoney(sum, t.amount),
      0,
    ),
    balanceAfter: balanceLookup.get(date) ?? 0,
    transactions: txs,
  }));
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

interface UseTransactionsReturn {
  data:              TransactionGroupHeader[];
  isLoading:         boolean;
  isError:           boolean;
  isEmpty:           boolean;
  error:             string | null;
  refresh:           () => Promise<void>;
  addTransaction:    (data: NewTransaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  formatDateHeader:  (date: string) => string;
  runningBalances:   Map<string, number>;
}

export function useTransactions(): UseTransactionsReturn {
  const storeTransactions = useTransactionStore((s) => s.transactions);
  const filters           = useTransactionStore((s) => s.filters);
  const storeAdd          = useTransactionStore((s) => s.addTransaction);
  const storeDelete       = useTransactionStore((s) => s.deleteTransaction);
  const accounts          = useAccountStore((s) => s.accounts);

  const addTransaction = useCallback(async (data: NewTransaction) => {
    storeAdd(buildTransaction(data));
  }, [storeAdd]);

  const removeTransaction = useCallback(async (id: string) => {
    const tx = storeTransactions.find((t) => t.id === id);
    if (!tx) return;

    // Capture state for UNDO
    const originalTx = { ...tx };
    const originalAccount = accounts.find((a) => a.id === tx.accountId);
    const originalAccountBalance = originalAccount ? originalAccount.balance : null;

    let originalLoanState: any = null;
    if (tx.source === 'loan') {
      const matches = tx.note?.match(/EMI Installment repayment for "([^"]+)"/);
      if (matches && matches[1]) {
        const loanName = matches[1];
        const loans = useLoansStore.getState().loans;
        const targetLoan = loans.find((l) => l.name === loanName && l.accountId === tx.accountId);
        if (targetLoan) {
          originalLoanState = {
            id: targetLoan.id,
            completedPayments: targetLoan.completedPayments,
            amountPaid: targetLoan.amountPaid,
            nextPaymentDate: targetLoan.nextPaymentDate,
            reminderExpoId: targetLoan.reminderExpoId,
            remindersEnabled: targetLoan.remindersEnabled,
            reminderTime: targetLoan.reminderTime,
            type: targetLoan.type,
            name: targetLoan.name,
            counterparty: targetLoan.counterparty,
            emiAmount: targetLoan.emiAmount,
          };
        }
      }
    }

    // 1. Revert account balance
    if (originalAccount) {
      const diff = tx.amount;
      const nextBalance = tx.type === 'income' ? originalAccount.balance - diff : originalAccount.balance + diff;
      useAccountStore.getState().updateAccount(tx.accountId, { balance: nextBalance });
    }

    // 2. If it's a loan transaction, rollback the loan parameters
    if (tx.source === 'loan' && originalLoanState && originalLoanState.completedPayments > 0) {
      const prevDate = format(addMonths(parseISO(originalLoanState.nextPaymentDate), -1), 'yyyy-MM-dd');
      const newCompleted = originalLoanState.completedPayments - 1;
      const newAmountPaid = Math.max(0, originalLoanState.amountPaid - originalLoanState.emiAmount);
      
      useLoansStore.getState().updateLoan(originalLoanState.id, {
        amountPaid: newAmountPaid,
        completedPayments: newCompleted,
        nextPaymentDate: prevDate,
      });

      // Reschedule reminder notification if enabled
      const updatedLoan = useLoansStore.getState().loans.find((l) => l.id === originalLoanState.id);
      if (updatedLoan && updatedLoan.remindersEnabled && updatedLoan.reminderTime) {
        try {
          if (originalLoanState.reminderExpoId) {
            await cancelScheduledReminder(originalLoanState.reminderExpoId).catch(() => {});
          }
          const title = originalLoanState.type === 'BORROWED' ? 'Loan Repayment Due' : 'Loan Installment Due';
          const body = originalLoanState.type === 'BORROWED'
            ? `Repayment of ${originalLoanState.emiAmount} is due for "${originalLoanState.name}" to ${originalLoanState.counterparty}.`
            : `Repayment of ${originalLoanState.emiAmount} for "${originalLoanState.name}" is due from ${originalLoanState.counterparty}.`;

          const newExpoId = await scheduleReminderNotification(
            title,
            body,
            updatedLoan.reminderTime,
            'none',
            [],
            updatedLoan.nextPaymentDate
          );
          useLoansStore.getState().updateLoan(originalLoanState.id, { reminderExpoId: newExpoId });
        } catch (e) {
          console.warn('Failed to reschedule loan reminder:', e);
        }
      }
    }

    // 3. Delete transaction from store
    storeDelete(id);

    // 4. Show toast notification with undo option
    toast.show(
      'Transaction deleted',
      'success',
      4500,
      'Undo',
      async () => {
        // --- UNDO CALLBACK ---
        // Restore transaction to store
        useTransactionStore.getState().addTransaction(originalTx);

        // Restore account balance
        if (originalAccount && originalAccountBalance !== null) {
          useAccountStore.getState().updateAccount(originalTx.accountId, { balance: originalAccountBalance });
        }

        // Restore loan parameters
        if (originalLoanState) {
          useLoansStore.getState().updateLoan(originalLoanState.id, {
            amountPaid: originalLoanState.amountPaid,
            completedPayments: originalLoanState.completedPayments,
            nextPaymentDate: originalLoanState.nextPaymentDate,
          });

          // Restore reminder notification
          if (originalLoanState.remindersEnabled && originalLoanState.reminderTime) {
            try {
              const currentLoan = useLoansStore.getState().loans.find((l) => l.id === originalLoanState.id);
              if (currentLoan && currentLoan.reminderExpoId) {
                await cancelScheduledReminder(currentLoan.reminderExpoId).catch(() => {});
              }
              const title = originalLoanState.type === 'BORROWED' ? 'Loan Repayment Due' : 'Loan Installment Due';
              const body = originalLoanState.type === 'BORROWED'
                ? `Repayment of ${originalLoanState.emiAmount} is due for "${originalLoanState.name}" to ${originalLoanState.counterparty}.`
                : `Repayment of ${originalLoanState.emiAmount} for "${originalLoanState.name}" is due from ${originalLoanState.counterparty}.`;

              const newExpoId = await scheduleReminderNotification(
                title,
                body,
                originalLoanState.reminderTime,
                'none',
                [],
                originalLoanState.nextPaymentDate
              );
              useLoansStore.getState().updateLoan(originalLoanState.id, { reminderExpoId: newExpoId });
            } catch (e) {
              console.warn('Failed to restore loan reminder:', e);
            }
          }
        }
        toast.success('Transaction restored');
      }
    );
  }, [storeDelete, storeTransactions, accounts]);

  const filtered = useMemo(() => {
    let txs = storeTransactions;
    if (filters.type !== 'all') {
      if (filters.type === 'loan') {
        txs = txs.filter((t) => t.source === 'loan');
      } else {
        txs = txs.filter((t) => t.type === filters.type);
      }
    }
    if (filters.category !== 'all')   txs = txs.filter((t) => t.category === filters.category);
    if (filters.month)                txs = txs.filter((t) => t.date.startsWith(filters.month!));
    if (filters.accountId)            txs = txs.filter((t) => t.accountId === filters.accountId);
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  }, [storeTransactions, filters]);

  const balanceLookup = useMemo(
    () => buildBalanceLookup(storeTransactions, filters.accountId),
    [storeTransactions, filters.accountId],
  );

  const runningBalances = useMemo(
    () => calculateRunningBalances(storeTransactions, accounts),
    [storeTransactions, accounts],
  );

  const grouped = useMemo(
    () => groupTransactionsByDate(filtered, balanceLookup),
    [filtered, balanceLookup],
  );

  return {
    data:              grouped,
    isLoading:         false,
    isError:           false,
    isEmpty:           grouped.length === 0,
    error:             null,
    refresh:           async () => {},
    addTransaction,
    removeTransaction,
    formatDateHeader,
    runningBalances,
  };
}
