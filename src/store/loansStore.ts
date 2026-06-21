import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { addMonths, format, differenceInDays, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoanType = 'BORROWED' | 'LENT';

export interface Loan {
  id:                string;
  name:              string;
  counterparty:      string;
  type:              LoanType;
  principalAmount:   number;
  amountPaid:        number;
  interestRate:      number;
  startDate:         string;
  nextPaymentDate:   string;
  emiAmount:         number;
  totalPayments:     number;
  completedPayments: number;
  color:             string;
  remindersEnabled?: boolean;
  reminderTime?:     string;
  reminderExpoId?:   string | null;
  accountId?:        string;
}

interface LoansState {
  loans:         Loan[];
  isLoading:     boolean;
  addLoan:       (loan: Omit<Loan, 'id' | 'amountPaid' | 'completedPayments'> & Partial<Pick<Loan, 'id' | 'amountPaid' | 'completedPayments'>>) => void;
  recordPayment: (loanId: string) => void;
  deleteLoan:    (loanId: string) => void;
  updateLoan:    (loanId: string, updates: Partial<Loan>) => void;
  reset:         () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function daysUntilPayment(loan: Loan): number {
  return differenceInDays(parseISO(loan.nextPaymentDate), new Date());
}

export function loanProgress(loan: Loan): number {
  return loan.totalPayments > 0 ? loan.completedPayments / loan.totalPayments : 0;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLoansStore = create<LoansState>()(
  persist(
    (set) => ({
      loans:     [],
      isLoading: false,

      addLoan: (draft) => {
        const loan: Loan = {
          id: draft.id || `loan-${Date.now()}`,
          amountPaid: draft.amountPaid || 0,
          completedPayments: draft.completedPayments || 0,
          remindersEnabled: draft.remindersEnabled ?? false,
          reminderTime: draft.reminderTime ?? '09:00',
          reminderExpoId: draft.reminderExpoId ?? null,
          accountId: draft.accountId ?? '',
          ...draft,
        };
        set((s) => ({ loans: [loan, ...s.loans] }));
      },

      recordPayment: (loanId) => {
        set((s) => ({
          loans: s.loans.map((l) => {
            if (l.id !== loanId) return l;
            return {
              ...l,
              amountPaid:        l.amountPaid + l.emiAmount,
              completedPayments: l.completedPayments + 1,
              nextPaymentDate:   format(addMonths(parseISO(l.nextPaymentDate), 1), 'yyyy-MM-dd'),
            };
          }),
        }));
      },

      deleteLoan: (loanId) => {
        set((s) => ({ loans: s.loans.filter((l) => l.id !== loanId) }));
      },

      updateLoan: (loanId, updates) => {
        set((s) => ({
          loans: s.loans.map((l) => (l.id === loanId ? { ...l, ...updates } : l)),
        }));
      },

      reset: () => set({ loans: [] }),
    }),
    {
      name: 'wc-loans',
      storage: zustandStorage,
      partialize: (s) => ({ loans: s.loans }),
    }
  )
);
