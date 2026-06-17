import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAccountStore } from '@store/accountStore';
import type { TransactionListItemProps } from '../types';

export const TransactionListItem = memo(function TransactionListItem({
  transaction,
  onPress,
  onLongPress,
}: TransactionListItemProps) {
  const { colors, isDark } = useTheme();
  const accounts = useAccountStore((s) => s.accounts);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const date = format(new Date(transaction.date), 'h:mm a');
  const isIncome = transaction.type === 'income';

  const isRedundant = transaction.description.trim().toLowerCase() === transaction.category.trim().toLowerCase();
  const subtitle = isRedundant
    ? date
    : `${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} · ${date}`;

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(transaction);
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed
            ? (isDark ? colors.glass.background : 'rgba(0,0,0,0.04)')
            : 'transparent',
        },
      ]}
    >
      <CategoryIcon category={transaction.category} size={46} />

      <View style={styles.details}>
        <AppText variant="labelLG" color={colors.text.primary} numberOfLines={1}>
          {transaction.description}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" color={colors.text.secondary}>
            {subtitle}
          </AppText>
          {account && (
            <View
              style={[
                styles.accountBadge,
                {
                  backgroundColor: isDark ? account.color + '22' : account.color + '15',
                  borderColor:     isDark ? account.color + '44' : account.color + '30',
                },
              ]}
            >
              <Ionicons name={(account.icon || 'wallet-outline') as any} size={10} color={account.color} />
              <AppText style={[styles.accountBadgeText, { color: account.color }]}>
                {account.name}
              </AppText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.right}>
        <AmountText
          amount={transaction.amount}
          currency={transaction.currency}
          type={transaction.type === 'transfer' ? 'income' : transaction.type}
          variant="labelLG"
          showSign
        />
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isIncome
                ? colors.status.income + '18'
                : colors.status.expense + '18',
            },
          ]}
        >
          <AppText
            variant="caption"
            color={isIncome ? colors.status.income : colors.status.expense}
          >
            {transaction.type}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.lg,
    minHeight: Layout.transactionRowHeight,
  },
  details: { flex: 1, gap: 3 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  accountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
