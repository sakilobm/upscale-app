import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { addMonths, addWeeks, addYears, format, differenceInDays, parseISO, isBefore, subDays, isAfter } from 'date-fns';
import type { TransactionCategory } from '@store/types';

import { useTransactionStore } from './transactionStore';
import { useAccountStore } from './accountStore';
import { toast } from './toastStore';
import { usePreferencesStore } from './preferencesStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'UPCOMING' | 'OVERDUE' | 'SETTLED';
export type RecurringInterval = 'weekly' | 'monthly' | 'yearly';

export interface PlannedPayment {
  id:                string;
  title:             string;
  amount:            number;
  amountPaid:        number; // How much has been paid/spent so far
  dueDate:           string;
  category:          TransactionCategory;
  accountId:         string; // Associated bank/cash account
  status:            PaymentStatus;
  isRecurring:       boolean;
  recurringInterval?: RecurringInterval;
  settledAt?:        string;
  notificationId?:   string; // Store scheduled Expo notification ID
}

interface PlannedPaymentsState {
  payments:       PlannedPayment[];
  isLoading:      boolean;
  addPayment:     (payment: Omit<PlannedPayment, 'id' | 'status' | 'settledAt' | 'amountPaid' | 'notificationId'>) => void;
  payPartial:     (paymentId: string, amount: number, accountId: string, note?: string) => void;
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

// Helper to schedule background notifications for upcoming payments
async function schedulePlannedPaymentReminder(
  payment: Omit<PlannedPayment, 'status' | 'settledAt' | 'amountPaid' | 'notificationId'> & { id: string }
): Promise<string | null> {
  try {
    const prefs = usePreferencesStore.getState().notifPrefs;
    if (!prefs.plannedPay) return null;

    const due = parseISO(payment.dueDate);
    const reminderDate = subDays(due, 2);

    // If the reminder date is in the future, schedule a local system notification
    if (isAfter(reminderDate, new Date())) {
      const { scheduleReminderNotification } = await import('@features/notifications/services/notificationService');
      const dateStr = format(reminderDate, 'yyyy-MM-dd');
      
      const currencySymbol = '$';
      const amountStr = `${currencySymbol}${payment.amount.toFixed(2)}`;

      const expoId = await scheduleReminderNotification(
        'Payment Reminder 📅',
        `Your payment of ${amountStr} for "${payment.title}" is due in 2 days.`,
        '09:00',
        'none',
        [],
        dateStr
      );
      return expoId;
    }
  } catch (err) {
    console.error('[NotificationService] Failed to schedule planned payment reminder:', err);
  }
  return null;
}

async function cancelPlannedPaymentReminder(notificationId?: string) {
  if (!notificationId) return;
  try {
    const { cancelScheduledReminder } = await import('@features/notifications/services/notificationService');
    await cancelScheduledReminder(notificationId);
  } catch (err) {
    console.error('[NotificationService] Failed to cancel scheduled reminder:', err);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlannedPaymentsStore = create<PlannedPaymentsState>()(
  persist(
    (set) => ({
      payments:  [],
      isLoading: false,

      addPayment: (draft) => {
        const id = `pp-${Date.now()}`;
        const payment: PlannedPayment = { ...draft, id, status: computeStatus(draft.dueDate), amountPaid: 0 };
        set((s) => ({ payments: [payment, ...s.payments] }));

        // Schedule background reminder
        setTimeout(async () => {
          const notificationId = await schedulePlannedPaymentReminder({ ...draft, id });
          if (notificationId) {
            usePlannedPaymentsStore.getState().updatePayment(id, { notificationId });
          }
        }, 100);
      },

      payPartial: (paymentId, amount, accountId, note) => {
        set((s) => {
          let updatedPayment: PlannedPayment | null = null;
          const nextPayments = s.payments.map((p) => {
            if (p.id !== paymentId) return p;
            const paid = (p.amountPaid ?? 0) + amount;
            const isFullyPaid = paid >= p.amount;
            updatedPayment = {
              ...p,
              amountPaid: paid,
              status: isFullyPaid ? 'SETTLED' as const : p.status,
              settledAt: isFullyPaid ? format(new Date(), 'yyyy-MM-dd') : undefined,
              accountId,
            };
            return updatedPayment;
          });

          if (updatedPayment) {
            const payment = updatedPayment as PlannedPayment;
            
            // Cancel notification if fully paid
            if (payment.status === 'SETTLED' && payment.notificationId) {
              cancelPlannedPaymentReminder(payment.notificationId);
            }

            const { accounts, updateAccount } = useAccountStore.getState();
            const { addTransaction } = useTransactionStore.getState();
            const account = accounts.find((a) => a.id === accountId);

            if (account) {
              const now = new Date().toISOString();
              const newTx = {
                id: `tx-budget-partial-${payment.id}-${Date.now()}`,
                userId: 'user-1',
                type: 'expense' as const,
                category: payment.category,
                amount,
                currency: account.currency,
                description: `${payment.title} (Partial)`,
                note: note || `Partial payment of ${amount} for budget "${payment.title}"`,
                date: now,
                accountId,
                source: 'budget' as const,
                createdAt: now,
                updatedAt: now,
              };

              addTransaction(newTx);
              updateAccount(accountId, { balance: account.balance - amount });
              toast.success(`Recorded payment of ${amount} for "${payment.title}" in ${account.name}`);
            }
          }

          return { payments: nextPayments };
        });

        // Trigger recurring spawn if payment became fully settled
        const payment = usePlannedPaymentsStore.getState().payments.find((p) => p.id === paymentId);
        if (payment?.status === 'SETTLED' && payment.isRecurring && payment.recurringInterval) {
          const nextDue =
            payment.recurringInterval === 'weekly'  ? addWeeks(parseISO(payment.dueDate), 1)  :
            payment.recurringInterval === 'monthly' ? addMonths(parseISO(payment.dueDate), 1) :
                                                      addYears(parseISO(payment.dueDate), 1);
          
          // Add the recurring next instance
          usePlannedPaymentsStore.getState().addPayment({
            title: payment.title,
            amount: payment.amount,
            dueDate: format(nextDue, 'yyyy-MM-dd'),
            category: payment.category,
            accountId: payment.accountId,
            isRecurring: payment.isRecurring,
            recurringInterval: payment.recurringInterval,
          });
        }
      },

      settlePayment: (paymentId) => {
        const payment = usePlannedPaymentsStore.getState().payments.find((p) => p.id === paymentId);
        
        if (payment && payment.status !== 'SETTLED') {
          // Cancel active notification
          if (payment.notificationId) {
            cancelPlannedPaymentReminder(payment.notificationId);
          }

          const remAmount = payment.amount - (payment.amountPaid ?? 0);
          if (remAmount > 0) {
            const { addTransaction } = useTransactionStore.getState();
            const { updateAccount, accounts } = useAccountStore.getState();
            
            const account = accounts.find((a) => a.id === payment.accountId);
            const now = new Date().toISOString();
            
            const newTx = {
              id: `tx-settled-${payment.id}-${Date.now()}`,
              userId: 'user-1',
              type: 'expense' as const,
              category: payment.category,
              amount: remAmount,
              currency: account?.currency ?? 'USD',
              description: payment.title,
              note: `Settled planned payment remaining balance`,
              date: now,
              accountId: payment.accountId,
              source: 'budget' as const,
              createdAt: now,
              updatedAt: now,
            };
            
            addTransaction(newTx);
            
            if (account) {
              updateAccount(payment.accountId, { balance: account.balance - remAmount });
              toast.success(`"${payment.title}" settled & recorded in ${account.name}!`);
            } else {
              toast.success(`"${payment.title}" settled!`);
            }
          }
        }

        set((s) => ({
          payments: s.payments.map((p) => {
            if (p.id !== paymentId) return p;
            return { ...p, amountPaid: p.amount, status: 'SETTLED' as PaymentStatus, settledAt: format(new Date(), 'yyyy-MM-dd') };
          }),
        }));

        // Spawn next occurrence for recurring
        if (payment?.isRecurring && payment.recurringInterval) {
          const nextDue =
            payment.recurringInterval === 'weekly'  ? addWeeks(parseISO(payment.dueDate), 1)  :
            payment.recurringInterval === 'monthly' ? addMonths(parseISO(payment.dueDate), 1) :
                                                      addYears(parseISO(payment.dueDate), 1);
          
          usePlannedPaymentsStore.getState().addPayment({
            title: payment.title,
            amount: payment.amount,
            dueDate: format(nextDue, 'yyyy-MM-dd'),
            category: payment.category,
            accountId: payment.accountId,
            isRecurring: payment.isRecurring,
            recurringInterval: payment.recurringInterval,
          });
        }
      },

      deletePayment: (paymentId) => {
        const payment = usePlannedPaymentsStore.getState().payments.find((p) => p.id === paymentId);
        if (payment?.notificationId) {
          cancelPlannedPaymentReminder(payment.notificationId);
        }
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
