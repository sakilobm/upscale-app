import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { toast } from '@store/toastStore';
import { applyNumpad } from '../utils/numpad';
import type { Transaction } from '@store/types';

/**
 * Headless custom hook for coordinating bank/account fund transfers.
 * Implements atomic updates for both source and target accounts.
 */
export function useTransferFunds(onSuccess: () => void) {
  const accounts = useAccountStore((s) => s.accounts);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amountStr, setAmountStr] = useState('0');
  const [note, setNote] = useState('');

  const reset = useCallback(() => {
    const accounts_ = useAccountStore.getState().accounts;
    if (accounts_.length >= 2) {
      setFromAccountId(accounts_[0].id);
      setToAccountId(accounts_[1].id);
    } else if (accounts_.length === 1) {
      setFromAccountId(accounts_[0].id);
      setToAccountId('');
    } else {
      setFromAccountId('');
      setToAccountId('');
    }
    setAmountStr('0');
    setNote('');
  }, []);

  const handleKey = useCallback((key: string) => {
    setAmountStr((prev) => applyNumpad(prev, key));
  }, []);

  const swapAccounts = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const temp = fromAccountId;
    setFromAccountId(toAccountId);
    setToAccountId(temp);
  }, [fromAccountId, toAccountId]);

  const handleSave = useCallback(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!fromAccountId || !toAccountId) {
      toast.error('Select source and destination accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    const fromAccount = accounts.find((a) => a.id === fromAccountId);
    const toAccount = accounts.find((a) => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
      toast.error('Selected accounts not found');
      return;
    }

    if (fromAccount.balance < amount) {
      toast.error(`Insufficient funds in ${fromAccount.name}`);
      return;
    }

    const now = new Date().toISOString();
    const description = `Transfer: ${fromAccount.name} → ${toAccount.name}`;
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: 'user-1',
      type: 'transfer',
      category: 'transfer',
      amount,
      currency: fromAccount.currency,
      description,
      note: note.trim() || null,
      date: now,
      accountId: fromAccountId,
      toAccountId,
      createdAt: now,
      updatedAt: now,
    };

    addTransaction(newTx);
    updateAccount(fromAccountId, { balance: fromAccount.balance - amount });
    updateAccount(toAccountId, { balance: toAccount.balance + amount });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Funds transferred successfully');
    onSuccess();
  }, [amountStr, fromAccountId, toAccountId, note, accounts, addTransaction, updateAccount, onSuccess]);

  const amountDisplay = parseFloat(amountStr || '0').toLocaleString('en-US', {
    minimumFractionDigits: amountStr.includes('.')
      ? Math.min(amountStr.split('.')[1]?.length ?? 0, 2)
      : 0,
    maximumFractionDigits: 2,
  });

  return {
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    amountStr,
    handleKey,
    note,
    setNote,
    accounts,
    amountDisplay,
    swapAccounts,
    handleSave,
    reset,
  };
}
