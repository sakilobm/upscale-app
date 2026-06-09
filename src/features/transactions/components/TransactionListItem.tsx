import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { format } from 'date-fns';
import type { TransactionListItemProps } from '../types';

export const TransactionListItem = memo(function TransactionListItem({
  transaction,
  onPress,
  onLongPress,
}: TransactionListItemProps) {
  const { colors, isDark } = useTheme();
  const date = format(new Date(transaction.date), 'h:mm a');
  const isIncome = transaction.type === 'income';

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
        <AppText variant="caption" color={colors.text.secondary}>
          {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} · {date}
        </AppText>
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
  right: { alignItems: 'flex-end', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
