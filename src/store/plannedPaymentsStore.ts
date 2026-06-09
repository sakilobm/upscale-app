import { create } from 'zustand';
import { addDays, addMonths, addWeeks, addYears, format, differenceInDays, parseISO, isBefore } from 'date-fns';
import type { TransactionCategory } from '@store/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentStatus = 'UPCOMING' | 'OVERDUE' | 'SETTLED';
export type RecurringInterval = 'weekly' | 'monthly' | 'yearly';

export interface PlannedPayment {
  id:                string;
  title:             string;
  amount:            number;
  dueDate:           string;
  category:          TransactionCategory;
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

// ─── Demo seed ────────────────────────────────────────────────────────────────

const today = new Date();
const SEED: PlannedPayment[] = [
  {
    id:                'pp-1',
    title:             'Rent',
    amount:            1800,
    dueDate:           format(addDays(today, 1), 'yyyy-MM-dd'),
    category:          'housing',
    status:            'UPCOMING',
    isRecurring:       true,
    recurringInterval: 'monthly',
  },
  {
    id:                'pp-2',
    title:             'Netflix',
    amount:            15.99,
    dueDate:           format(addDays(today, 3), 'yyyy-MM-dd'),
    category:          'entertainment',
    status:            'UPCOMING',
    isRecurring:       true,
    recurringInterval: 'monthly',
  },
  {
    id:                'pp-3',
    title:             'Gym Membership',
    amount:            45,
    dueDate:           format(addDays(today, 7), 'yyyy-MM-dd'),
    category:          'health',
    status:            'UPCOMING',
    isRecurring:       true,
    recurringInterval: 'monthly',
  },
  {
    id:                'pp-4',
    title:             'Car Insurance',
    amount:            220,
    dueDate:           format(addDays(today, 12), 'yyyy-MM-dd'),
    category:          'transport',
    status:            'UPCOMING',
    isRecurring:       true,
    recurringInterval: 'monthly',
  },
  {
    id:                'pp-5',
    title:             'Dentist Appointment',
    amount:            180,
    dueDate:           format(addDays(today, 18), 'yyyy-MM-dd'),
    category:          'health',
    status:            'UPCOMING',
    isRecurring:       false,
  },
  {
    id:                'pp-6',
    title:             'Spotify',
    amount:            9.99,
    dueDate:           format(addDays(today, -2), 'yyyy-MM-dd'),
    category:          'entertainment',
    status:            'OVERDUE',
    isRecurring:       true,
    recurringInterval: 'monthly',
  },
  {
    id:                'pp-7',
    title:             'Annual Domain Renewal',
    amount:            12.50,
    dueDate:           format(addDays(today, -10), 'yyyy-MM-dd'),
    category:          'other',
    status:            'SETTLED',
    isRecurring:       true,
    recurringInterval: 'yearly',
    settledAt:         format(addDays(today, -9), 'yyyy-MM-dd'),
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlannedPaymentsStore = create<PlannedPaymentsState>((set) => ({
  payments:  SEED,
  isLoading: false,

  addPayment: (draft) => {
    const payment: PlannedPayment = {
      ...draft,
      id:     `pp-${Date.now()}`,
      status: computeStatus(draft.dueDate),
    };
    set((s) => ({ payments: [payment, ...s.payments] }));
  },

  settlePayment: (paymentId) => {
    set((s) => ({
      payments: s.payments.map((p) => {
        if (p.id !== paymentId) return p;
        const settled: PlannedPayment = {
          ...p,
          status:    'SETTLED',
          settledAt: format(new Date(), 'yyyy-MM-dd'),
        };
        if (p.isRecurring && p.recurringInterval) {
          const nextDue =
            p.recurringInterval === 'weekly'  ? addWeeks(parseISO(p.dueDate), 1)  :
            p.recurringInterval === 'monthly' ? addMonths(parseISO(p.dueDate), 1) :
                                                addYears(parseISO(p.dueDate), 1);
          const next: PlannedPayment = {
            ...p,
            id:       `pp-${Date.now()}-next`,
            dueDate:  format(nextDue, 'yyyy-MM-dd'),
            status:   'UPCOMING',
            settledAt: undefined,
          };
          return settled; // the next occurrence is added separately below
        }
        return settled;
      }),
    }));
    // For recurring: spawn next occurrence
    const payment = usePlannedPaymentsStore.getState().payments.find((p) => p.id === paymentId);
    if (payment?.isRecurring && payment.recurringInterval) {
      const nextDue =
        payment.recurringInterval === 'weekly'  ? addWeeks(parseISO(payment.dueDate), 1)  :
        payment.recurringInterval === 'monthly' ? addMonths(parseISO(payment.dueDate), 1) :
                                                   addYears(parseISO(payment.dueDate), 1);
      set((s) => ({
        payments: [
          ...s.payments,
          {
            ...payment,
            id:        `pp-${Date.now()}-r`,
            dueDate:   format(nextDue, 'yyyy-MM-dd'),
            status:    'UPCOMING',
            settledAt: undefined,
          },
        ],
      }));
    }
  },

  deletePayment: (paymentId) => {
    set((s) => ({ payments: s.payments.filter((p) => p.id !== paymentId) }));
  },

  updatePayment: (paymentId, updates) => {
    set((s) => ({
      payments: s.payments.map((p) =>
        p.id === paymentId ? { ...p, ...updates } : p
      ),
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
}));
