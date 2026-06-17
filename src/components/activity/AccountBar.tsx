/**
 * @file AccountBar.tsx
 * @architecture Presentation Layer — UI Component
 * @description Horizontal scrollable bar of account filter chips plus a "Manage" button.
 *   Reads account and filter state directly from stores (display-layer concern).
 * @associatedFiles src/components/activity/AccountChip.tsx, src/app/(tabs)/transactions.tsx
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AccountChip } from './AccountChip';
import type { ChipData } from './AccountChip';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { Spacing } from '@constants/index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export function AccountBar() {
  const { colors } = useTheme();
  const accounts   = useAccountStore((s) => s.accounts);
  const filters    = useTransactionStore((s) => s.filters);
  const setFilters = useTransactionStore((s) => s.setFilters);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const allChip: ChipData = {
    id: null, name: 'All',
    icon: 'wallet-outline' as IoniconName,
    color: colors.brand.primary,
    balance: totalBalance,
  };

  const chips: ChipData[] = [
    allChip,
    ...accounts.map((a) => ({
      id:      a.id,
      name:    a.name,
      icon:    a.icon as IoniconName,
      color:   a.color,
      balance: a.balance,
    })),
  ];

  return (
    <View style={s.outer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content}>
        {chips.map((chip) => (
          <AccountChip
            key={chip.id ?? 'all'}
            chip={chip}
            isActive={chip.id === filters.accountId}
            onPress={() => setFilters({ accountId: chip.id })}
          />
        ))}
        <Pressable
          onPress={() => router.push('/accounts')}
          style={({ pressed }) => [s.manageBtn, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Ionicons name="settings-outline" size={14} color={colors.text.secondary} />
          <AppText variant="labelSM" color={colors.text.secondary} style={{ fontSize: 12 }}>Manage</AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  outer:     { paddingLeft: Spacing['5'] },
  content:   { paddingRight: Spacing['5'], alignItems: 'center' },
  manageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
  },
});
