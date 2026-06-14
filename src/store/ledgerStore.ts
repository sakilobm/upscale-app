import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { format } from 'date-fns';

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
