import { useCallback } from 'react';
import { useLoansStore, daysUntilPayment, loanProgress } from '@store/loansStore';
import type { LoanType, Loan } from '@store/loansStore';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import { buildTransaction } from '@features/transactions/services/transactionService';
import {
  scheduleReminderNotification,
  cancelScheduledReminder,
  requestNotificationPermission,
} from '@features/notifications/services/notificationService';
import { toast } from '@store/toastStore';

export function useLoans(type?: LoanType) {
  const loans         = useLoansStore((s) => s.loans);
  const storeAdd      = useLoansStore((s) => s.addLoan);
  const storeRecord   = useLoansStore((s) => s.recordPayment);
  const storeDelete   = useLoansStore((s) => s.deleteLoan);
  const updateLoan    = useLoansStore((s) => s.updateLoan);

  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateAccount  = useAccountStore((s) => s.updateAccount);
  const accounts       = useAccountStore((s) => s.accounts);

  const filtered = type ? loans.filter((l) => l.type === type) : loans;

  const totalDebt = loans
    .filter((l) => l.type === 'BORROWED')
    .reduce((sum, l) => sum + (l.principalAmount - l.amountPaid), 0);

  const totalLent = loans
    .filter((l) => l.type === 'LENT')
    .reduce((sum, l) => sum + (l.principalAmount - l.amountPaid), 0);

  const upcomingPayments = loans.filter((l) => {
    const days = daysUntilPayment(l);
    return days >= 0 && days <= 7;
  });

  // ─── Add Loan (with optional principal transaction) ─────────────────────────
  const addLoan = useCallback((
    draft: Omit<Loan, 'id' | 'amountPaid' | 'completedPayments'>,
    postPrincipal = false
  ) => {
    const loanId = `loan-${Date.now()}`;
    
    // Create the loan
    storeAdd({
      ...draft,
      id: loanId,
      amountPaid: 0,
      completedPayments: 0,
      remindersEnabled: false,
      reminderExpoId: null,
      reminderTime: '09:00',
    });

    // Optionally post principal transaction
    if (postPrincipal && draft.accountId) {
      const account = accounts.find((a) => a.id === draft.accountId);
      if (account) {
        const txType = draft.type === 'BORROWED' ? 'income' : 'expense';
        const description = `${draft.name} (Principal)`;
        
        const newTx = buildTransaction({
          type: txType,
          category: 'Loan Principal',
          amount: draft.principalAmount,
          currency: account.currency,
          description,
          note: `Principal amount for loan: "${draft.name}" with ${draft.counterparty}`,
          date: draft.startDate || new Date().toISOString().slice(0, 10),
          accountId: draft.accountId,
          source: 'loan' as any,
        });

        addTransaction(newTx);

        // Update balance
        const nextBalance = txType === 'income'
          ? account.balance + draft.principalAmount
          : account.balance - draft.principalAmount;
        
        updateAccount(draft.accountId, { balance: nextBalance });
      }
    }

    toast.success(`Loan "${draft.name}" created successfully`);
    return loanId;
  }, [accounts, addTransaction, updateAccount, storeAdd]);

  // ─── Record EMI Payment (adds transaction and updates account) ─────────────
  const recordPayment = useCallback(async (loanId: string, customAccountId?: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    // 1. Update loan in store
    storeRecord(loanId);

    // Get the latest values for rescheduling
    const latestLoans = useLoansStore.getState().loans;
    const updatedLoan = latestLoans.find((l) => l.id === loanId);

    // 2. Reschedule notification if enabled
    if (updatedLoan && updatedLoan.remindersEnabled && updatedLoan.reminderTime) {
      try {
        if (loan.reminderExpoId) {
          await cancelScheduledReminder(loan.reminderExpoId).catch(() => {});
        }
        const title = loan.type === 'BORROWED' ? 'Loan Repayment Due' : 'Loan Installment Due';
        const body = loan.type === 'BORROWED'
          ? `Repayment of ${loan.emiAmount} is due for "${loan.name}" to ${loan.counterparty}.`
          : `Repayment of ${loan.emiAmount} for "${loan.name}" is due from ${loan.counterparty}.`;

        const newExpoId = await scheduleReminderNotification(
          title,
          body,
          updatedLoan.reminderTime,
          'none',
          [],
          updatedLoan.nextPaymentDate
        );
        updateLoan(loanId, { reminderExpoId: newExpoId });
      } catch (e) {
        console.warn('Failed to reschedule loan reminder:', e);
      }
    }

    // 3. Post payment transaction
    const targetAccountId = customAccountId || loan.accountId || (accounts.find((a) => a.isDefault) ?? accounts[0])?.id;
    if (targetAccountId) {
      const account = accounts.find((a) => a.id === targetAccountId);
      if (account) {
        const txType = loan.type === 'BORROWED' ? 'expense' : 'income';
        const description = `${loan.name} — Installment #${loan.completedPayments + 1}`;

        const newTx = buildTransaction({
          type: txType,
          category: 'Loan Payment',
          amount: loan.emiAmount,
          currency: account.currency,
          description,
          note: `EMI Installment repayment for "${loan.name}"`,
          date: new Date().toISOString(),
          accountId: targetAccountId,
          source: 'loan' as any,
        });

        addTransaction(newTx);

        // Update balance
        const nextBalance = txType === 'income'
          ? account.balance + loan.emiAmount
          : account.balance - loan.emiAmount;
        
        updateAccount(targetAccountId, { balance: nextBalance });

        toast.success(`Recorded Installment #${loan.completedPayments + 1} of ${loan.emiAmount.toLocaleString()}`);
      }
    }
  }, [loans, storeRecord, accounts, addTransaction, updateAccount, updateLoan]);

  // ─── Toggle Repayment Reminders ────────────────────────────────────────────
  const toggleLoanReminder = useCallback(async (loanId: string, enabled: boolean, reminderTime = '09:00') => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    let updatedExpoId: string | null = loan.reminderExpoId || null;

    if (enabled) {
      // Request permission
      const hasPerm = await requestNotificationPermission();
      if (!hasPerm) {
        throw new Error('Notification permission not granted');
      }

      // Cancel existing if any
      if (loan.reminderExpoId) {
        await cancelScheduledReminder(loan.reminderExpoId).catch(() => {});
      }

      // Schedule one-time notification
      const title = loan.type === 'BORROWED' ? 'Loan Repayment Due' : 'Loan Installment Due';
      const body = loan.type === 'BORROWED'
        ? `Repayment of ${loan.emiAmount} is due for "${loan.name}" to ${loan.counterparty}.`
        : `Repayment of ${loan.emiAmount} for "${loan.name}" is due from ${loan.counterparty}.`;

      updatedExpoId = await scheduleReminderNotification(
        title,
        body,
        reminderTime,
        'none',
        [],
        loan.nextPaymentDate
      );
    } else {
      // Cancel
      if (loan.reminderExpoId) {
        await cancelScheduledReminder(loan.reminderExpoId).catch(() => {});
        updatedExpoId = null;
      }
    }

    updateLoan(loanId, {
      remindersEnabled: enabled,
      reminderTime,
      reminderExpoId: updatedExpoId,
    });

    if (enabled) {
      toast.success(`Reminders enabled for "${loan.name}"`);
    } else {
      toast.info(`Reminders disabled for "${loan.name}"`);
    }
  }, [loans, updateLoan]);

  // ─── Delete Loan (cancels scheduled notifications) ────────────────────────
  const deleteLoan = useCallback(async (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (loan && loan.reminderExpoId) {
      await cancelScheduledReminder(loan.reminderExpoId).catch(() => {});
    }
    storeDelete(loanId);
    if (loan) {
      toast.success(`Deleted loan contract "${loan.name}"`);
    }
  }, [loans, storeDelete]);

  return {
    loans: filtered,
    totalDebt,
    totalLent,
    upcomingPayments,
    addLoan,
    recordPayment,
    deleteLoan,
    updateLoan,
    toggleLoanReminder,
    daysUntilPayment,
    loanProgress,
  };
}
