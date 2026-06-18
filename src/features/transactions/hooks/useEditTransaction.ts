/**
 * @file useEditTransaction.ts
 * @architecture Business Logic Layer — Headless Feature Hook
 * @description Encapsulates form state and business logic for editing a transaction.
 *   Handles validation and updates state in both transaction and account stores,
 *   performing balance corrections when modifying amount, type, or account.
 * @associatedFiles src/components/transactions/EditTransactionSheet.tsx,
 *   src/store/transactionStore.ts, src/store/accountStore.ts
 */

import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { useCategoryStore } from '@store/categoryStore';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import type { Transaction } from '@store/types';

export function useEditTransaction(
  transaction: Transaction | null,
  onSuccess: () => void
) {
  const { colors } = useTheme();
  const accounts = useAccountStore((s) => s.accounts);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const allCategories = useCategoryStore((s) => s.categories);

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Prefill form when transaction is provided
  useEffect(() => {
    if (transaction) {
      if (transaction.type === 'income' || transaction.type === 'expense') {
        setType(transaction.type);
      } else {
        setType('expense');
      }
      setAmountStr(String(transaction.amount));
      setCategory(transaction.category);
      setAccountId(transaction.accountId);
      setNote(transaction.note ?? '');
      setDateStr(transaction.date.slice(0, 10)); // Extract YYYY-MM-DD from ISO string
    }
  }, [transaction]);

  const handleSave = useCallback(() => {
    if (!transaction) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    const selectedAccount = accounts.find((a) => a.id === accountId);
    if (!selectedAccount) {
      toast.error('Select an account');
      return;
    }

    // 1. Formulate ISO date string
    // Keep the original time part if we are editing the same day, otherwise use noon UTC
    const originalTime = transaction.date.slice(10);
    const newDateIso = dateStr === transaction.date.slice(0, 10)
      ? `${dateStr}${originalTime}`
      : `${dateStr}T12:00:00.000Z`;

    // 2. Update accounts balance (Correcting the difference)
    const oldAccountId = transaction.accountId;
    const newAccountId = accountId;

    if (oldAccountId === newAccountId) {
      const account = accounts.find((a) => a.id === oldAccountId);
      if (account) {
        let baseBalance = account.balance;
        // Revert old effect
        baseBalance += transaction.type === 'income' ? -transaction.amount : transaction.amount;
        // Apply new effect
        baseBalance += type === 'income' ? amount : -amount;
        updateAccount(oldAccountId, { balance: baseBalance });
      }
    } else {
      const oldAcc = accounts.find((a) => a.id === oldAccountId);
      const newAcc = accounts.find((a) => a.id === newAccountId);
      if (oldAcc) {
        // Revert old effect
        updateAccount(oldAccountId, {
          balance: oldAcc.balance + (transaction.type === 'income' ? -transaction.amount : transaction.amount)
        });
      }
      if (newAcc) {
        // Apply new effect
        updateAccount(newAccountId, {
          balance: newAcc.balance + (type === 'income' ? amount : -amount)
        });
      }
    }

    // 3. Update the transaction
    updateTransaction(transaction.id, {
      type,
      category,
      amount,
      currency: selectedAccount.currency,
      description: note.trim() || (allCategories.find((c) => c.id === category)?.label ?? category),
      note: note.trim() || null,
      date: newDateIso,
      accountId,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Transaction updated');
    onSuccess();
  }, [
    transaction,
    amountStr,
    type,
    category,
    accountId,
    note,
    dateStr,
    accounts,
    allCategories,
    updateTransaction,
    updateAccount,
    onSuccess,
  ]);

  const cats = allCategories.filter((c) =>
    type === 'expense'
      ? c.applicableTo === 'expense' || c.applicableTo === 'both'
      : c.applicableTo === 'income' || c.applicableTo === 'both'
  );

  const accentColor = type === 'expense' ? colors.status.expense : colors.status.income;

  return {
    type,
    setType,
    amountStr,
    setAmountStr,
    category,
    setCategory,
    accountId,
    setAccountId,
    note,
    setNote,
    dateStr,
    setDateStr,
    cats,
    accounts,
    accentColor,
    handleSave,
  };
}
