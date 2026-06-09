import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Colors, Spacing, Layout, Radius } from '@constants/index';
import { format } from 'date-fns';
import type { TransactionListItemProps } from '../types';

export const TransactionListItem = memo(function TransactionListItem({
  transaction,
  onPress,
  onLongPress,
}: TransactionListItemProps) {
  const date = format(new Date(transaction.date), 'h:mm a');

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLongPress?.(transaction);
      }}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <CategoryIcon category={transaction.category} size={46} />

      <View style={styles.details}>
        <AppText variant="labelLG" color={Colors.text.primary} numberOfLines={1}>
          {transaction.description}
        </AppText>
        <AppText variant="caption" color={Colors.text.secondary}>
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
              backgroundColor:
                transaction.type === 'income'
                  ? Colors.status.income + '20'
                  : Colors.status.expense + '20',
            },
          ]}
        >
          <AppText
            variant="caption"
            color={
              transaction.type === 'income'
                ? Colors.status.income
                : Colors.status.expense
            }
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
  pressed: {
    backgroundColor: Colors.glass.background,
  },
  details: {
    flex: 1,
    gap: 3,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
});
