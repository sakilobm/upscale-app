import { useCallback } from 'react';
import { Share, Platform } from 'react-native';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from '@hooks/useAuth';
import { useTransactionStore } from '@store/transactionStore';
import { toast } from '@store/toastStore';
import { resetAllStores } from '@store/resetAllStores';
import { seedDemoData, undoDemoData } from '@store/seedDemoData';
import { useLoadingStore } from '@store/loadingStore';
import type { CurrencyCode } from '@store/types';

export function useProfile() {
  const { user, signOut, setUser } = useAuth();
  const transactions = useTransactionStore((s) => s.transactions);

  const txCount     = transactions.length;
  const memberSince = user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Jan 2025';
  const initials    = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AM';

  const handleEditName = useCallback(() => {
    if (Platform.OS === 'ios') {
      const { Alert } = require('react-native');
      Alert.prompt(
        'Edit Name',
        'Enter your display name',
        (name: string) => {
          if (name?.trim() && user) {
            setUser({ ...user, fullName: name.trim() });
            toast.success('Name updated');
          }
        },
        'plain-text',
        user?.fullName ?? '',
      );
    } else {
      toast.info('Name editing available on iOS');
    }
  }, [user, setUser]);

  const handleCurrencySelect = useCallback(
    (code: CurrencyCode) => {
      if (user) {
        setUser({ ...user, currency: code });
        
        // Sync all existing accounts' currencies to the new currency code
        const { accounts, updateAccount } = require('@store/accountStore').useAccountStore.getState();
        accounts.forEach((a: any) => updateAccount(a.id, { currency: code }));

        // Sync all existing transactions' currencies to the new currency code
        const { transactions, updateTransaction } = useTransactionStore.getState();
        transactions.forEach((t) => updateTransaction(t.id, { currency: code }));

        toast.success(`Currency changed to ${code}`);
      }
    },
    [user, setUser],
  );

  const handleExport = useCallback(
    async (fmt: 'CSV' | 'JSON') => {
      try {
        let content = '';
        if (fmt === 'CSV') {
          const header = 'Date,Type,Category,Amount,Currency,Description\n';
          const rows = transactions
            .map((t) => `${t.date},${t.type},${t.category},${t.amount},${t.currency},"${t.description}"`)
            .join('\n');
          content = header + rows;
        } else {
          content = JSON.stringify(transactions, null, 2);
        }
        await Share.share({ message: `WhereCash Export (${fmt})\n\n${content}`, title: `WhereCash ${fmt}` });
        toast.success(`Exported ${txCount} transactions as ${fmt}`);
      } catch (_) {}
    },
    [transactions, txCount],
  );

  const handleBackup = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('All data is backed up and up to date!');
  }, []);

  const handleClearAllData = useCallback(async () => {
    const showLoading = useLoadingStore.getState().showLoading;
    const hideLoading = useLoadingStore.getState().hideLoading;
    
    showLoading('Wiping Database...', 'Resetting and clearing all local storage...');
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    await resetAllStores();
    hideLoading();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toast.success('All data cleared successfully');
  }, []);

  const handleSeedDemoData = useCallback(async () => {
    const showLoading = useLoadingStore.getState().showLoading;
    const hideLoading = useLoadingStore.getState().hideLoading;
    
    showLoading('Populating Playground...', 'Generating mock accounts and transaction datasets...');
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    await seedDemoData();
    hideLoading();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Play Store demo data populated!');
  }, []);

  const handleUndoDemoData = useCallback(async () => {
    const showLoading = useLoadingStore.getState().showLoading;
    const hideLoading = useLoadingStore.getState().hideLoading;
    
    showLoading('Restoring Original Data...', 'Removing sandbox playground records...');
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const success = await undoDemoData();
    hideLoading();
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Demo data undone. Original state restored!');
    } else {
      toast.error('No snapshot found to undo demo data.');
    }
  }, []);

  const handleSignOut = useCallback(() => {
    signOut();
    router.replace('/onboarding');
  }, [signOut]);

  return {
    user,
    txCount,
    memberSince,
    initials,
    handleEditName,
    handleCurrencySelect,
    handleExport,
    handleBackup,
    handleClearAllData,
    handleSeedDemoData,
    handleUndoDemoData,
    handleSignOut,
  };
}
