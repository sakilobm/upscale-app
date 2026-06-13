import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { addDays, subDays, format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerDirection = 'OWED_TO_ME' | 'I_OWE';
export type LedgerStatus    = 'ACTIVE' | 'SETTLED' | 'OVERDUE';

export interface PartialReturn {
  id:     string;
  amount: number;
  date:   string;
  note?:  string;
}

export interface LedgerEntry {
  id:              string;
  personName:      string;
  personPhone?:    string;
  personInitials:  string;
  personColor:     string;
  direction:       LedgerDirection;
  totalAmount:     number;
  amountReturned:  number;
  currency:        string;
  date:            string;
  dueDate?:        string;
  note?:           string;
  status:          LedgerStatus;
  partialReturns:  PartialReturn[];
}

interface LedgerState {
  entries:           LedgerEntry[];
  isLoading:         boolean;
  addEntry:          (entry: Omit<LedgerEntry, 'id' | 'amountReturned' | 'status' | 'partialReturns'>) => void;
  addPartialReturn:  (entryId: string, amount: number, note?: string) => void;
  settleEntry:       (entryId: string) => void;
  deleteEntry:       (entryId: string) => void;
  updateEntry:       (entryId: string, updates: Partial<LedgerEntry>) => void;
  recalculateStatus: () => void;
  reset:             () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const PERSON_COLORS = ['#6C63FF', '#10B981', '#FB923C', '#EC4899', '#38BDF8', '#F59E0B'];

function personColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + (hash << 5) - hash;
  return PERSON_COLORS[Math.abs(hash) % PERSON_COLORS.length];
}

function computeStatus(entry: Pick<LedgerEntry, 'amountReturned' | 'totalAmount' | 'dueDate'>): LedgerStatus {
  if (entry.amountReturned >= entry.totalAmount) return 'SETTLED';
  if (entry.dueDate && new Date(entry.dueDate) < new Date()) return 'OVERDUE';
  return 'ACTIVE';
}

// ─── Demo seed ────────────────────────────────────────────────────────────────

function buildSeed(): LedgerEntry[] {
  const today = new Date();
  return [
    { id: 'l-1', personName: 'Marcus Chen',  personInitials: 'MC', personColor: '#6C63FF', direction: 'OWED_TO_ME', totalAmount: 562,  amountReturned: 0,   currency: 'USD', date: format(subDays(today, 20), 'yyyy-MM-dd'), dueDate: format(addDays(today, 5), 'yyyy-MM-dd'),   note: 'Vacation fund advance',  status: 'ACTIVE',   partialReturns: [] },
    { id: 'l-2', personName: 'Sofia Rivera', personInitials: 'SR', personColor: '#10B981', direction: 'OWED_TO_ME', totalAmount: 200,  amountReturned: 80,  currency: 'USD', date: format(subDays(today, 10), 'yyyy-MM-dd'), dueDate: format(addDays(today, 15), 'yyyy-MM-dd'),  note: 'Concert tickets',        status: 'ACTIVE',   partialReturns: [{ id: 'pr-1', amount: 80,  date: format(subDays(today, 3),  'yyyy-MM-dd'), note: 'First installment' }] },
    { id: 'l-3', personName: 'James Park',   personInitials: 'JP', personColor: '#FB923C', direction: 'I_OWE',      totalAmount: 350,  amountReturned: 100, currency: 'USD', date: format(subDays(today, 30), 'yyyy-MM-dd'), dueDate: format(subDays(today, 5), 'yyyy-MM-dd'),   note: 'Dinner + drinks',        status: 'OVERDUE',  partialReturns: [{ id: 'pr-2', amount: 100, date: format(subDays(today, 15), 'yyyy-MM-dd'), note: 'Partial' }] },
    { id: 'l-4', personName: 'Priya Sharma', personInitials: 'PS', personColor: '#EC4899', direction: 'I_OWE',      totalAmount: 120,  amountReturned: 120, currency: 'USD', date: format(subDays(today, 45), 'yyyy-MM-dd'),                                                         note: 'Grocery run',            status: 'SETTLED',  partialReturns: [{ id: 'pr-3', amount: 120, date: format(subDays(today, 40), 'yyyy-MM-dd') }] },
  ];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set) => ({
      entries:   [],
      isLoading: false,

      addEntry: (draft) => {
        const entry: LedgerEntry = { ...draft, id: `l-${Date.now()}`, personInitials: initials(draft.personName), personColor: personColor(draft.personName), amountReturned: 0, status: 'ACTIVE', partialReturns: [] };
        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      addPartialReturn: (entryId, amount, note) => {
        set((s) => ({
          entries: s.entries.map((e) => {
            if (e.id !== entryId) return e;
            const returned = e.amountReturned + amount;
            const pr: PartialReturn = { id: `pr-${Date.now()}`, amount, date: format(new Date(), 'yyyy-MM-dd'), note };
            return { ...e, amountReturned: returned, partialReturns: [...e.partialReturns, pr], status: computeStatus({ ...e, amountReturned: returned }) };
          }),
        }));
      },

      settleEntry: (entryId) => {
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === entryId ? { ...e, amountReturned: e.totalAmount, status: 'SETTLED' } : e
          ),
        }));
      },

      deleteEntry: (entryId) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== entryId) }));
      },

      updateEntry: (entryId, updates) => {
        set((s) => ({
          entries: s.entries.map((e) => (e.id === entryId ? { ...e, ...updates } : e)),
        }));
      },

      recalculateStatus: () => {
        set((s) => ({ entries: s.entries.map((e) => ({ ...e, status: computeStatus(e) })) }));
      },

      reset: () => set({ entries: [] }),
    }),
    {
      name: 'wc-ledger',
      storage: zustandStorage,
      partialize: (s) => ({ entries: s.entries }),
    }
  )
);
