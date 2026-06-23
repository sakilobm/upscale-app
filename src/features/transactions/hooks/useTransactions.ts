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
    running += tx.type === 'income' ? tx.amount : -tx.amount;
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
      (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
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
    if (tx) {
      // 1. Revert account balance
      const account = accounts.find((a) => a.id === tx.accountId);
      if (account) {
        const diff = tx.amount;
        const nextBalance = tx.type === 'income' ? account.balance - diff : account.balance + diff;
        useAccountStore.getState().updateAccount(tx.accountId, { balance: nextBalance });
      }

      // 2. If it's a loan transaction, rollback the loan parameters
      if (tx.source === 'loan') {
        const matches = tx.note?.match(/EMI Installment repayment for "([^"]+)"/);
        if (matches && matches[1]) {
          const loanName = matches[1];
          const loans = useLoansStore.getState().loans;
          const targetLoan = loans.find((l) => l.name === loanName && l.accountId === tx.accountId);
          if (targetLoan && targetLoan.completedPayments > 0) {
            const prevDate = format(addMonths(parseISO(targetLoan.nextPaymentDate), -1), 'yyyy-MM-dd');
            const newCompleted = targetLoan.completedPayments - 1;
            const newAmountPaid = Math.max(0, targetLoan.amountPaid - targetLoan.emiAmount);
            
            useLoansStore.getState().updateLoan(targetLoan.id, {
              amountPaid: newAmountPaid,
              completedPayments: newCompleted,
              nextPaymentDate: prevDate,
            });

            // Reschedule reminder notification if enabled
            const updatedLoan = useLoansStore.getState().loans.find((l) => l.id === targetLoan.id);
            if (updatedLoan && updatedLoan.remindersEnabled && updatedLoan.reminderTime) {
              try {
                if (targetLoan.reminderExpoId) {
                  await cancelScheduledReminder(targetLoan.reminderExpoId).catch(() => {});
                }
                const title = targetLoan.type === 'BORROWED' ? 'Loan Repayment Due' : 'Loan Installment Due';
                const body = targetLoan.type === 'BORROWED'
                  ? `Repayment of ${targetLoan.emiAmount} is due for "${targetLoan.name}" to ${targetLoan.counterparty}.`
                  : `Repayment of ${targetLoan.emiAmount} for "${targetLoan.name}" is due from ${targetLoan.counterparty}.`;

                const newExpoId = await scheduleReminderNotification(
                  title,
                  body,
                  updatedLoan.reminderTime,
                  'none',
                  [],
                  updatedLoan.nextPaymentDate
                );
                useLoansStore.getState().updateLoan(targetLoan.id, { reminderExpoId: newExpoId });
              } catch (e) {
                console.warn('Failed to reschedule loan reminder:', e);
              }
            }
          }
        }
      }
    }
    storeDelete(id);
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
    return txs;
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
