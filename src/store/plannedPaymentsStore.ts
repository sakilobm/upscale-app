import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { addMonths, addWeeks, addYears, format, differenceInDays, parseISO, isBefore } from 'date-fns';
import type { TransactionCategory } from '@store/types';

import { useTransactionStore } from './transactionStore';
import { useAccountStore } from './accountStore';
import { toast } from './toastStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'UPCOMING' | 'OVERDUE' | 'SETTLED';
export type RecurringInterval = 'weekly' | 'monthly' | 'yearly';

export interface PlannedPayment {
  id:                string;
  title:             string;
  amount:            number;
  dueDate:           string;
  category:          TransactionCategory;
  accountId:         string; // Associated bank/cash account
  status:            PaymentStatus;
  isRecurring:       boolean;
  recurringInterval?: RecurringInterval;
  settledAt?:        string;
}

interface PlannedPaymentsState {
  payments:       PlannedPayment[];
  isLoading:      boolean;
  addPayment:     (payment: Omit<PlannedPayment, 'id' | 'status' | 'settledAt'>) => void;
  settlePayment:  (paymentId: string) => void;
  deletePayment:  (paymentId: string) => void;
  updatePayment:  (paymentId: string, updates: Partial<PlannedPayment>) => void;
  refreshStatus:  () => void;
  reset:          () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(dueDate: string): PaymentStatus {
  const due = parseISO(dueDate);
  if (isBefore(due, new Date())) return 'OVERDUE';
  return 'UPCOMING';
}

export function daysUntilDue(dueDate: string): number {
  return differenceInDays(parseISO(dueDate), new Date());
}

export function isUrgent(dueDate: string): boolean {
  const days = daysUntilDue(dueDate);
  return days >= 0 && days <= 3;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlannedPaymentsStore = create<PlannedPaymentsState>()(
  persist(
    (set) => ({
      payments:  [],
      isLoading: false,

      addPayment: (draft) => {
        const payment: PlannedPayment = { ...draft, id: `pp-${Date.now()}`, status: computeStatus(draft.dueDate) };
        set((s) => ({ payments: [payment, ...s.payments] }));
      },

      settlePayment: (paymentId) => {
        const payment = usePlannedPaymentsStore.getState().payments.find((p) => p.id === paymentId);
        
        if (payment && payment.status !== 'SETTLED') {
          // Record a transaction in transaction store (ledger)
          const { addTransaction } = useTransactionStore.getState();
          const { updateAccount, accounts } = useAccountStore.getState();
          
          const account = accounts.find((a) => a.id === payment.accountId);
          const now = new Date().toISOString();
          
          const newTx = {
            id: `tx-settled-${payment.id}-${Date.now()}`,
            userId: 'user-1',
            type: 'expense' as const,
            category: payment.category,
            amount: payment.amount,
            currency: account?.currency ?? 'USD',
            description: payment.title,
            note: `Sattled planned payment`,
            date: now,
            accountId: payment.accountId,
            createdAt: now,
            updatedAt: now,
          };
          
          addTransaction(newTx);
          
          if (account) {
            updateAccount(payment.accountId, { balance: account.balance - payment.amount });
            toast.success(`"${payment.title}" settled & recorded in ${account.name}!`);
          } else {
            toast.success(`"${payment.title}" settled!`);
          }
        }

        set((s) => ({
          payments: s.payments.map((p) => {
            if (p.id !== paymentId) return p;
            return { ...p, status: 'SETTLED' as PaymentStatus, settledAt: format(new Date(), 'yyyy-MM-dd') };
          }),
        }));

        // Spawn next occurrence for recurring
        if (payment?.isRecurring && payment.recurringInterval) {
          const nextDue =
            payment.recurringInterval === 'weekly'  ? addWeeks(parseISO(payment.dueDate), 1)  :
            payment.recurringInterval === 'monthly' ? addMonths(parseISO(payment.dueDate), 1) :
                                                      addYears(parseISO(payment.dueDate), 1);
          set((s) => ({
            payments: [
              ...s.payments,
              { ...payment, id: `pp-${Date.now()}-r`, dueDate: format(nextDue, 'yyyy-MM-dd'), status: 'UPCOMING', settledAt: undefined },
            ],
          }));
        }
      },

      deletePayment: (paymentId) => {
        set((s) => ({ payments: s.payments.filter((p) => p.id !== paymentId) }));
      },

      updatePayment: (paymentId, updates) => {
        set((s) => ({
          payments: s.payments.map((p) => (p.id === paymentId ? { ...p, ...updates } : p)),
        }));
      },

      refreshStatus: () => {
        set((s) => ({
          payments: s.payments.map((p) => {
            if (p.status === 'SETTLED') return p;
            return { ...p, status: computeStatus(p.dueDate) };
          }),
        }));
      },

      reset: () => set({ payments: [] }),
    }),
    {
      name: 'wc-planned-payments',
      storage: zustandStorage,
      partialize: (s) => ({ payments: s.payments }),
    }
  )
);
