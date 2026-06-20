import { useCallback } from 'react';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { toast } from '@store/toastStore';
import type { PlannedPayment } from '@store/plannedPaymentsStore';

export function usePlannedPayments() {
  const payments     = usePlannedPaymentsStore((s) => s.payments);
  const storeSettle  = usePlannedPaymentsStore((s) => s.settlePayment);
  const storeDelete  = usePlannedPaymentsStore((s) => s.deletePayment);
  const storeAdd     = usePlannedPaymentsStore((s) => s.addPayment);

  const storePayPartial = usePlannedPaymentsStore((s) => s.payPartial);

  const settlePayment = useCallback((id: string) => {
    storeSettle(id);
  }, [storeSettle]);

  const deletePayment = useCallback((id: string) => {
    storeDelete(id);
  }, [storeDelete]);

  const payPartial = useCallback((id: string, amount: number, accountId: string, note?: string) => {
    storePayPartial(id, amount, accountId, note);
  }, [storePayPartial]);

  const addPayment = useCallback(
    (data: Omit<PlannedPayment, 'id' | 'status' | 'settledAt' | 'amountPaid'>) => {
      storeAdd(data);
      toast.success(`"${data.title}" added to planned payments`);
    },
    [storeAdd],
  );

  return { payments, settlePayment, deletePayment, addPayment, payPartial };
}
