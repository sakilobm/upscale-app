import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { useCategoryStore } from '@store/categoryStore';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import { applyNumpad } from '../utils/numpad';
import type { Transaction } from '@store/types';

export function useQuickAddTransaction(onSuccess: () => void) {
  const { colors } = useTheme();
  const accounts     = useAccountStore((s) => s.accounts);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const allCategories  = useCategoryStore((s) => s.categories);

  const [type,      setType]      = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [category,  setCategory]  = useState('food');
  const [accountId, setAccountId] = useState('');
  const [note,      setNote]      = useState('');

  // Called by the screen when the sheet opens, passing the initial transaction type
  const reset = useCallback((nextType: 'expense' | 'income') => {
    const accounts_ = useAccountStore.getState().accounts;
    const defaultId = (accounts_.find((a) => a.isDefault) ?? accounts_[0])?.id ?? '';
    setType(nextType);
    setAmountStr('0');
    setCategory(nextType === 'expense' ? 'food' : 'salary');
    setAccountId(defaultId);
    setNote('');
  }, []);

  const handleTypeChange = useCallback((t: 'expense' | 'income') => {
    setType(t);
    setCategory(t === 'expense' ? 'food' : 'salary');
  }, []);

  const handleKey = useCallback((key: string) => {
    setAmountStr((prev) => applyNumpad(prev, key));
  }, []);

  const handleSave = useCallback(() => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    const account = accounts.find((a) => a.id === accountId);
    if (!account) { toast.error('Select an account'); return; }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id:          `tx-${Date.now()}`,
      userId:      'user-1',
      type,
      category,
      amount,
      currency:    account.currency,
      description: note.trim() || (allCategories.find((c) => c.id === category)?.label ?? category),
      note:        note.trim() || null,
      date:        now,
      accountId,
      createdAt:   now,
      updatedAt:   now,
    };

    addTransaction(newTx);
    updateAccount(accountId, {
      balance: type === 'income' ? account.balance + amount : account.balance - amount,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added`);
    onSuccess();
  }, [amountStr, type, category, accountId, note, accounts, allCategories, addTransaction, updateAccount, onSuccess]);

  const cats = allCategories.filter((c) =>
    type === 'expense'
      ? c.applicableTo === 'expense' || c.applicableTo === 'both'
      : c.applicableTo === 'income'  || c.applicableTo === 'both'
  );

  const amountDisplay = parseFloat(amountStr || '0').toLocaleString('en-US', {
    minimumFractionDigits: amountStr.includes('.')
      ? Math.min(amountStr.split('.')[1]?.length ?? 0, 2)
      : 0,
    maximumFractionDigits: 2,
  });

  const accentColor = type === 'expense' ? colors.status.expense : colors.status.income;

  return {
    type,
    handleTypeChange,
    amountStr,
    handleKey,
    category,
    setCategory,
    accountId,
    setAccountId,
    note,
    setNote,
    cats,
    accounts,
    amountDisplay,
    accentColor,
    handleSave,
    reset,
  };
}
