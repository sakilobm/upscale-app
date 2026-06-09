import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { format } from 'date-fns';
import type { Transaction } from '@store/types';

interface RecentTransactionRowProps {
  transaction: Transaction;
  onPress:     (transaction: Transaction) => void;
}

export const RecentTransactionRow = memo(function RecentTransactionRow({
  transaction,
  onPress,
}: RecentTransactionRowProps) {
  const { colors, isDark } = useTheme();
  const formattedDate = format(new Date(transaction.date), 'MMM d');

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [
        styles.container,
        {
          borderBottomColor: isDark
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(0,0,0,0.04)',
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <CategoryIcon category={transaction.category} size={44} />
      <View style={styles.details}>
        <AppText
          variant="labelMD"
          color={colors.text.primary}
          numberOfLines={1}
          style={styles.description}
        >
          {transaction.description}
        </AppText>
        <AppText variant="caption" color={colors.text.tertiary}>
          {transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} · {formattedDate}
        </AppText>
      </View>
      <AmountText
        amount={transaction.amount}
        currency={transaction.currency}
        type={transaction.type === 'transfer' ? 'income' : transaction.type}
        variant="labelLG"
        showSign
      />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    height:         68,
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  details: { flex: 1, gap: 3 },
  description: {
    fontWeight: '600',
  },
});
