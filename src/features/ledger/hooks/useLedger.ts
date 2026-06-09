import { useLedgerStore } from '@store/ledgerStore';
import type { LedgerDirection } from '@store/ledgerStore';

export function useLedger(direction?: LedgerDirection) {
  const entries        = useLedgerStore((s) => s.entries);
  const addEntry       = useLedgerStore((s) => s.addEntry);
  const addPartialReturn = useLedgerStore((s) => s.addPartialReturn);
  const settleEntry    = useLedgerStore((s) => s.settleEntry);
  const deleteEntry    = useLedgerStore((s) => s.deleteEntry);
  const updateEntry    = useLedgerStore((s) => s.updateEntry);

  const filtered = direction
    ? entries.filter((e) => e.direction === direction)
    : entries;

  const active   = filtered.filter((e) => e.status !== 'SETTLED');
  const settled  = filtered.filter((e) => e.status === 'SETTLED');
  const overdue  = filtered.filter((e) => e.status === 'OVERDUE');

  const totalOwedToMe = entries
    .filter((e) => e.direction === 'OWED_TO_ME' && e.status !== 'SETTLED')
    .reduce((sum, e) => sum + (e.totalAmount - e.amountReturned), 0);

  const totalIOwe = entries
    .filter((e) => e.direction === 'I_OWE' && e.status !== 'SETTLED')
    .reduce((sum, e) => sum + (e.totalAmount - e.amountReturned), 0);

  const netBalance = totalOwedToMe - totalIOwe;

  return {
    entries:      filtered,
    active,
    settled,
    overdue,
    totalOwedToMe,
    totalIOwe,
    netBalance,
    addEntry,
    addPartialReturn,
    settleEntry,
    deleteEntry,
    updateEntry,
  };
}
