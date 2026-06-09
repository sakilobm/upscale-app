import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Colors, Spacing, Layout } from '@constants/index';
import { format } from 'date-fns';
import type { Transaction } from '@store/types';

interface RecentTransactionRowProps {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
}

export const RecentTransactionRow = memo(function RecentTransactionRow({
  transaction,
  onPress,
}: RecentTransactionRowProps) {
  const formattedDate = format(new Date(transaction.date), 'MMM d');

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <CategoryIcon category={transaction.category} size={44} />

      <View style={styles.details}>
        <AppText variant="labelMD" color={Colors.text.primary} numberOfLines={1}>
          {transaction.description}
        </AppText>
        <AppText variant="caption" color={Colors.text.secondary}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    height: Layout.transactionRowHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glass.border,
  },
  details: {
    flex: 1,
    gap: 3,
  },
});
