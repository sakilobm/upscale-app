import { useTransactionStore }    from './transactionStore';
import { useAccountStore }         from './accountStore';
import { useCategoryStore }        from './categoryStore';
import { useBudgetStore }          from './budgetStore';
import { usePlannedPaymentsStore } from './plannedPaymentsStore';
import { useLedgerStore }          from './ledgerStore';
import { useLoansStore }           from './loansStore';
import { useNotificationStore }    from './notificationStore';
import { clearAllPersistedData }   from './storage';

export async function resetAllStores(): Promise<void> {
  await clearAllPersistedData();
  useTransactionStore.getState().reset();
  useAccountStore.getState().reset();
  useCategoryStore.getState().reset();
  useBudgetStore.getState().reset();
  usePlannedPaymentsStore.getState().reset();
  useLedgerStore.getState().reset();
  useLoansStore.getState().reset();
  useNotificationStore.getState().reset();
}
