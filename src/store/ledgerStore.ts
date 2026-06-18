import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { format } from 'date-fns';
import { useAccountStore } from './accountStore';
import { useTransactionStore } from './transactionStore';
import { toast } from './toastStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerDirection = 'OWED_TO_ME' | 'I_OWE';
export type LedgerStatus    = 'ACTIVE' | 'SETTLED' | 'OVERDUE';

export interface PartialReturn {
  id:        string;
  amount:    number;
  date:      string;
  note?:     string;
  accountId?: string;
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
  accountId?:      string;
}

interface LedgerState {
  entries:           LedgerEntry[];
  isLoading:         boolean;
  addEntry:          (entry: Omit<LedgerEntry, 'id' | 'amountReturned' | 'status' | 'partialReturns'> & { accountId?: string }) => void;
  addPartialReturn:  (entryId: string, amount: number, accountId: string, note?: string) => void;
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

        if (draft.accountId) {
          const { accounts, updateAccount } = useAccountStore.getState();
          const { addTransaction } = useTransactionStore.getState();
          const account = accounts.find((a) => a.id === draft.accountId);

          if (account) {
            const now = new Date().toISOString();
            const isOwed = draft.direction === 'OWED_TO_ME';
            const type = isOwed ? 'expense' as const : 'income' as const;

            const newTx = {
              id: `tx-ledger-add-${entry.id}`,
              userId: 'user-1',
              type,
              category: 'other',
              amount: draft.totalAmount,
              currency: account.currency,
              description: isOwed ? `Lent to ${draft.personName}` : `Borrowed from ${draft.personName}`,
              note: draft.note || (isOwed ? `Lent money to ${draft.personName}` : `Borrowed money from ${draft.personName}`),
              date: now,
              accountId: draft.accountId,
              createdAt: now,
              updatedAt: now,
            };

            addTransaction(newTx);
            const nextBalance = isOwed ? account.balance - draft.totalAmount : account.balance + draft.totalAmount;
            updateAccount(draft.accountId, { balance: nextBalance });
            toast.success(`Recorded ${isOwed ? 'loan' : 'borrowing'} of ${draft.totalAmount} in ${account.name}`);
          }
        }

        set((s) => ({ entries: [entry, ...s.entries] }));
      },

      addPartialReturn: (entryId, amount, accountId, note) => {
        set((s) => {
          let updatedEntry: LedgerEntry | null = null;
          const nextEntries = s.entries.map((e) => {
            if (e.id !== entryId) return e;
            const returned = e.amountReturned + amount;
            const pr: PartialReturn = {
              id: `pr-${Date.now()}`,
              amount,
              date: format(new Date(), 'yyyy-MM-dd'),
              note,
              accountId,
            };
            updatedEntry = {
              ...e,
              amountReturned: returned,
              partialReturns: [...e.partialReturns, pr],
              status: computeStatus({ ...e, amountReturned: returned }),
            };
            return updatedEntry;
          });

          if (updatedEntry && accountId) {
            const entry = updatedEntry as LedgerEntry;
            const { accounts, updateAccount } = useAccountStore.getState();
            const { addTransaction } = useTransactionStore.getState();
            const account = accounts.find((a) => a.id === accountId);

            if (account) {
              const now = new Date().toISOString();
              const isOwed = entry.direction === 'OWED_TO_ME';
              const type = isOwed ? 'income' as const : 'expense' as const;

              const newTx = {
                id: `tx-ledger-return-${entry.id}-${Date.now()}`,
                userId: 'user-1',
                type,
                category: 'other',
                amount,
                currency: account.currency,
                description: isOwed ? `Return: ${entry.personName}` : `Repay: ${entry.personName}`,
                note: note || (isOwed ? `Partial return from ${entry.personName}` : `Partial payment to ${entry.personName}`),
                date: now,
                accountId,
                createdAt: now,
                updatedAt: now,
              };

              addTransaction(newTx);
              const nextBalance = isOwed ? account.balance + amount : account.balance - amount;
              updateAccount(accountId, { balance: nextBalance });
              toast.success(`Recorded repayment of ${amount} in ${account.name}`);
            }
          }

          return { entries: nextEntries };
        });
      },

      settleEntry: (entryId) => {
        set((s) => {
          let updatedEntry: LedgerEntry | null = null;
          const nextEntries = s.entries.map((e) => {
            if (e.id !== entryId) return e;
            updatedEntry = { ...e, amountReturned: e.totalAmount, status: 'SETTLED' };
            return updatedEntry;
          });

          if (updatedEntry) {
            const oldEntry = s.entries.find((e) => e.id === entryId);
            if (oldEntry && oldEntry.status !== 'SETTLED') {
              const remAmount = oldEntry.totalAmount - oldEntry.amountReturned;
              const targetAccountId = oldEntry.accountId ?? (useAccountStore.getState().accounts.find((a) => a.isDefault) ?? useAccountStore.getState().accounts[0])?.id;

              if (remAmount > 0 && targetAccountId) {
                const { accounts, updateAccount } = useAccountStore.getState();
                const { addTransaction } = useTransactionStore.getState();
                const account = accounts.find((a) => a.id === targetAccountId);

                if (account) {
                  const now = new Date().toISOString();
                  const isOwed = oldEntry.direction === 'OWED_TO_ME';
                  const type = isOwed ? 'income' as const : 'expense' as const;

                  const newTx = {
                    id: `tx-ledger-settle-${oldEntry.id}-${Date.now()}`,
                    userId: 'user-1',
                    type,
                    category: 'other',
                    amount: remAmount,
                    currency: account.currency,
                    description: isOwed ? `Settle: ${oldEntry.personName}` : `Settle: Paid ${oldEntry.personName}`,
                    note: `Settled remaining balance of ${remAmount}`,
                    date: now,
                    accountId: targetAccountId,
                    createdAt: now,
                    updatedAt: now,
                  };

                  addTransaction(newTx);
                  const nextBalance = isOwed ? account.balance + remAmount : account.balance - remAmount;
                  updateAccount(targetAccountId, { balance: nextBalance });
                  toast.success(`Settled remaining ${remAmount} to ${account.name}`);
                }
              }
            }
          }

          return { entries: nextEntries };
        });
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
