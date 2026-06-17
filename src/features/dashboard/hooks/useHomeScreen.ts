/**
 * @file useHomeScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Manages all state for the Home dashboard screen: quick-add sheet
 *   visibility and type, quick-action list (with haptic openers), user display
 *   data, and transaction press navigation. Aggregates data from useDashboardData.
 * @associatedFiles src/features/dashboard/hooks/useDashboardData.ts, src/app/(tabs)/index.tsx
 */

import { useState, useCallback, useMemo, type ComponentProps } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardData } from './useDashboardData';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import { useTheme } from '@hooks/useTheme';
import type { Transaction } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface QuickAction {
  icon:   IoniconName;
  label:  string;
  color:  string;
  action: () => void;
}

export function useHomeScreen() {
  const { colors } = useTheme();
  const dashboard  = useDashboardData();
  const user       = useAuthStore((s) => s.user);

  const [addVisible, setAddVisible] = useState(false);
  const [addType,    setAddType]    = useState<'expense' | 'income'>('expense');

  const openAdd = useCallback((type: 'expense' | 'income') => {
    setAddType(type);
    setAddVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const closeAdd = useCallback(() => setAddVisible(false), []);

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    router.push('/(tabs)/transactions');
  }, []);

  const quickActions = useMemo<QuickAction[]>(() => [
    { icon: 'trending-down', label: 'Expense',  color: colors.status.expense, action: () => openAdd('expense') },
    { icon: 'trending-up',   label: 'Income',   color: colors.status.income,  action: () => openAdd('income') },
    { icon: 'shuffle',       label: 'Split',    color: colors.brand.primary,  action: () => toast.info('Split expenses — coming soon') },
    { icon: 'receipt',       label: 'Activity', color: colors.status.warning, action: () => router.push('/(tabs)/transactions') },
  ], [openAdd, colors]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Sakil';
  const initials  = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'SK';

  return {
    dashboard,
    user: { firstName, initials, avatarId: user?.avatarUrl ?? undefined, currency: user?.currency ?? 'USD' },
    addSheet: {
      isVisible: addVisible,
      type:      addType,
      open:      openAdd,
      close:     closeAdd,
    },
    quickActions,
    handleTransactionPress,
  };
}
