import { useState, useCallback } from 'react';
import { useCategoryStore } from '@store/categoryStore';
import { useAccountStore } from '@store/accountStore';

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

  const [title,    setTitleState]    = useState('');
  const [amount,   setAmountState]   = useState('');
  const [dueDate,  setDueDateState]  = useState('');
  const [category, setCategoryState] = useState('other');
  const [accountId, setAccountIdState] = useState('');
  const [error,     setError]         = useState<string | null>(null);

  const setTitle = useCallback((val: string) => { setTitleState(val); setError(null); }, [error]);
  const setAmount = useCallback((val: string) => { setAmountState(val); setError(null); }, [error]);
  const setDueDate = useCallback((val: string) => { setDueDateState(val); setError(null); }, [error]);
  const setCategory = useCallback((val: string) => { setCategoryState(val); setError(null); }, [error]);
  const setAccountId = useCallback((val: string) => { setAccountIdState(val); setError(null); }, [error]);

  const reset = useCallback(() => {
    const accounts_ = useAccountStore.getState().accounts;
    const defaultId = (accounts_.find((a) => a.isDefault) ?? accounts_[0])?.id ?? '';
    setTitleState('');
    setAmountState('');
    setDueDateState('');
    setCategoryState('other');
    setAccountIdState(defaultId);
    setError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    setError(null);
    const parsed = parseFloat(amount);
    if (!title.trim())                       { setError('Title is required');       return; }
    if (!parsed || parsed <= 0)              { setError('Enter a valid amount');    return; }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) { setError('Please select a due date');   return; }
    if (!accountId)                          { setError('Select an account');       return; }

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
    error,
  };
}
