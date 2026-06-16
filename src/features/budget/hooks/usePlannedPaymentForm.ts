import { useState, useCallback } from 'react';
import { useCategoryStore } from '@store/categoryStore';
import { toast } from '@store/toastStore';

export interface PlannedPaymentFormData {
  title:    string;
  amount:   number;
  dueDate:  string;
  category: string;
}

export function usePlannedPaymentForm(
  onSubmit: (data: PlannedPaymentFormData) => void,
  onClose:  () => void,
) {
  const allCategories = useCategoryStore((s) => s.categories);

  const [title,    setTitle]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [category, setCategory] = useState('other');

  const reset = useCallback(() => {
    setTitle('');
    setAmount('');
    setDueDate('');
    setCategory('other');
  }, []);

  const handleSubmit = useCallback(() => {
    const parsed = parseFloat(amount);
    if (!title.trim())                       { toast.error('Title is required');       return; }
    if (!parsed || parsed <= 0)              { toast.error('Enter a valid amount');    return; }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) { toast.error('Please select a due date');   return; }

    onSubmit({ title: title.trim(), amount: parsed, dueDate, category });
    reset();
    onClose();
  }, [title, amount, dueDate, category, onSubmit, onClose, reset]);

  const cats = allCategories.filter(
    (c) => c.applicableTo === 'expense' || c.applicableTo === 'both'
  );

  return {
    title,    setTitle,
    amount,   setAmount,
    dueDate,  setDueDate,
    category, setCategory,
    cats,
    handleSubmit,
    reset,
  };
}
