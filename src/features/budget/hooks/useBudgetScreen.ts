/**
 * @file useBudgetScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Manages all state for the Budget screen: add-payment sheet visibility,
 *   and aggregates budget and planned-payment data for the View layer.
 * @associatedFiles src/features/budget/hooks/useBudgets.ts,
 *   src/features/budget/hooks/usePlannedPayments.ts, src/app/(tabs)/budget.tsx
 */

import { useState } from 'react';
import { useBudgets } from './useBudgets';
import { usePlannedPayments } from './usePlannedPayments';

export function useBudgetScreen() {
  const { data: budgetsData, isLoading, isEmpty, refresh, summary, deleteBudget, spendingBreakdown } = useBudgets();
  const { payments, settlePayment, deletePayment, addPayment, payPartial } = usePlannedPayments();

  const [addVisible, setAddVisible] = useState(false);

  return {
    budgets:   budgetsData ?? [],
    isLoading, isEmpty, refresh, summary,
    payments,  settlePayment, deletePayment, addPayment, payPartial, deleteBudget,
    spendingBreakdown: spendingBreakdown ?? [],
    addSheet: {
      isVisible: addVisible,
      open:      () => setAddVisible(true),
      close:     () => setAddVisible(false),
    },
  };
}
