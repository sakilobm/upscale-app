import { useState, useCallback } from 'react';
import { useCategoryStore } from '@store/categoryStore';
import { useAccountStore } from '@store/accountStore';
import { toast } from '@store/toastStore';

export interface PlannedPaymentFormData {
  title:    string;
  amount:   number;
  dueDate:  string;
  category: string;
  accountId: string;
}

export function usePlannedPaymentForm(
  onSubmit: (data: PlannedPaymentFormData) => void,
  onClose:  () => void,
) {
  const allCategories = useCategoryStore((s) => s.categories);
  const accounts = useAccountStore((s) => s.accounts);

  const [title,    setTitle]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [category, setCategory] = useState('other');
  const [accountId, setAccountId] = useState('');

  const reset = useCallback(() => {
    const accounts_ = useAccountStore.getState().accounts;
    const defaultId = (accounts_.find((a) => a.isDefault) ?? accounts_[0])?.id ?? '';
    setTitle('');
    setAmount('');
    setDueDate('');
    setCategory('other');
    setAccountId(defaultId);
  }, []);

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(amount);
    if (!title.trim())                       { toast.error('Title is required');       return; }
    if (!parsed || parsed <= 0)              { toast.error('Enter a valid amount');    return; }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) { toast.error('Please select a due date');   return; }
    if (!accountId)                          { toast.error('Select an account');       return; }

    onSubmit({ title: title.trim(), amount: parsed, dueDate, category, accountId });
    reset();
    onClose();
  }, [title, amount, dueDate, category, accountId, onSubmit, onClose, reset]);

  const cats = allCategories.filter(
    (c) => c.applicableTo === 'expense' || c.applicableTo === 'both'
  );

  return {
    title,    setTitle,
    amount,   setAmount,
    dueDate,  setDueDate,
    category, setCategory,
    accountId, setAccountId,
    accounts,
    cats,
    handleSubmit,
    reset,
  };
}
