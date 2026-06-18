/**
 * @file useLedgerScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Manages all state machines, sheet toggles, derived data, and event handlers
 *   for the Ledger screen. Composes useLedger + useLoans into a single typed contract that
 *   the LedgerScreen view shell consumes via destructuring. Contains zero JSX.
 * @associatedFiles
 *   src/app/(tabs)/ledger.tsx,
 *   src/features/ledger/hooks/useLedger.ts,
 *   src/features/ledger/hooks/useLoans.ts
 */

import { useState, useCallback, useMemo } from 'react';
import { useLedger } from './useLedger';
import { useLoans }  from './useLoans';
import type { LedgerEntry, LedgerDirection } from '@store/ledgerStore';
import type { LedgerTab } from '../types';

// ─── Internal types ───────────────────────────────────────────────────────────

export type SheetMode = 'add' | 'partial';

export interface LedgerSection {
  title: string;
  data:  LedgerEntry[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLedgerScreen() {

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<LedgerTab>('owed_to_me');

  // ── Entry / partial-return sheet ───────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode,    setSheetMode]    = useState<SheetMode>('add');
  const [sheetEntry,   setSheetEntry]   = useState<LedgerEntry | undefined>();

  // ── Detail info sheet ──────────────────────────────────────────────────────
  const [infoEntry, setInfoEntry] = useState<LedgerEntry | undefined>();

  // ── Data layers ────────────────────────────────────────────────────────────
  const {
    entries: allEntries,
    totalOwedToMe,
    totalIOwe,
    addEntry,
    addPartialReturn,
    settleEntry,
    deleteEntry,
  } = useLedger();

  const { loans, recordPayment } = useLoans();

  // ── Derived data (memoised — no filtering logic in the view shell) ─────────

  const directionEntries = useMemo<LedgerEntry[]>(() => {
    if (activeTab === 'owed_to_me') return allEntries.filter((e) => e.direction === 'OWED_TO_ME');
    if (activeTab === 'i_owe')      return allEntries.filter((e) => e.direction === 'I_OWE');
    return [];
  }, [allEntries, activeTab]);

  const activeEntries  = useMemo(() => directionEntries.filter((e) => e.status !== 'SETTLED'), [directionEntries]);
  const settledEntries = useMemo(() => directionEntries.filter((e) => e.status === 'SETTLED'),  [directionEntries]);

  const sections = useMemo<LedgerSection[]>(() => [
    ...(activeEntries.length  > 0 ? [{ title: 'Active',  data: activeEntries  }] : []),
    ...(settledEntries.length > 0 ? [{ title: 'Settled', data: settledEntries }] : []),
  ], [activeEntries, settledEntries]);

  // ── Sheet toggles ──────────────────────────────────────────────────────────

  const openAddSheet = useCallback(() => {
    setSheetMode('add');
    setSheetEntry(undefined);
    setSheetVisible(true);
  }, []);

  const openPartialSheet = useCallback((entry: LedgerEntry) => {
    setSheetMode('partial');
    setSheetEntry(entry);
    setSheetVisible(true);
  }, []);

  const closeSheet     = useCallback(() => setSheetVisible(false), []);
  const openInfoSheet  = useCallback((entry: LedgerEntry) => setInfoEntry(entry), []);
  const closeInfoSheet = useCallback(() => setInfoEntry(undefined), []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Called when the LedgerEntrySheet submits a new entry.
   * Attaches today's date and delegates to the store; the store computes
   * personInitials and personColor from the name automatically.
   */
  const handleAddEntry = useCallback((data: {
    personName:  string;
    direction:   LedgerDirection;
    totalAmount: number;
    currency:    string;
    note?:       string;
    dueDate?:    string;
    accountId:   string;
  }) => {
    addEntry({
      ...data,
      personInitials: '',
      personColor:    '',
      date: new Date().toISOString().slice(0, 10),
    });
  }, [addEntry]);

  /** Marks an entry settled and dismisses the info sheet atomically. */
  const handleSettle = useCallback((id: string) => {
    settleEntry(id);
    setInfoEntry(undefined);
  }, [settleEntry]);

  // ── Public contract ────────────────────────────────────────────────────────

  return {
    // State
    activeTab,
    sheetVisible,
    sheetMode,
    sheetEntry,
    infoEntry,
    // Data
    totalOwedToMe,
    totalIOwe,
    loans,
    sections,
    activeEntries,
    // Handlers & toggles
    setActiveTab,
    openAddSheet,
    openPartialSheet,
    closeSheet,
    openInfoSheet,
    closeInfoSheet,
    handleAddEntry,
    handleSettle,
    deleteEntry,
    addPartialReturn,
    recordPayment,
  } as const;
}
