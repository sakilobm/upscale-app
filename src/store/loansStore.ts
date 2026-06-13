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
}

interface LoansState {
  loans:         Loan[];
  isLoading:     boolean;
  addLoan:       (loan: Omit<Loan, 'id' | 'amountPaid' | 'completedPayments'>) => void;
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

// ─── Demo seed ────────────────────────────────────────────────────────────────

function buildSeed(): Loan[] {
  const today = new Date();
  return [
    { id: 'loan-1', name: 'Home Loan',              counterparty: 'National Bank',    type: 'BORROWED', principalAmount: 250000, amountPaid: 46750,  interestRate: 6.5, startDate: '2023-01-01', nextPaymentDate: format(new Date(today.getFullYear(), today.getMonth(), 1),  'yyyy-MM-dd'), emiAmount: 1987.5, totalPayments: 240, completedPayments: 13, color: '#6C63FF' },
    { id: 'loan-2', name: 'Car Loan',               counterparty: 'Auto Finance Co.', type: 'BORROWED', principalAmount: 35000,  amountPaid: 12000,  interestRate: 8.2, startDate: '2022-06-01', nextPaymentDate: format(new Date(today.getFullYear(), today.getMonth(), 5),  'yyyy-MM-dd'), emiAmount: 643.75, totalPayments: 84,  completedPayments: 20, color: '#10B981' },
    { id: 'loan-3', name: 'Personal Loan to Tyler', counterparty: 'Tyler Brooks',     type: 'LENT',     principalAmount: 5000,   amountPaid: 2500,   interestRate: 0,   startDate: '2023-08-01', nextPaymentDate: format(new Date(today.getFullYear(), today.getMonth(), 15), 'yyyy-MM-dd'), emiAmount: 500,    totalPayments: 10,  completedPayments: 5,  color: '#FB923C' },
  ];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLoansStore = create<LoansState>()(
  persist(
    (set) => ({
      loans:     buildSeed(),
      isLoading: false,

      addLoan: (draft) => {
        const loan: Loan = { ...draft, id: `loan-${Date.now()}`, amountPaid: 0, completedPayments: 0 };
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
