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
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import type { TransactionListItemProps } from '../types';

export const TransactionListItem = memo(function TransactionListItem({
  transaction,
  onPress,
  onLongPress,
  balanceAfter,
}: TransactionListItemProps) {
  const { colors, isDark } = useTheme();
  const { symbol, format: formatCurrencyVal } = useFormatCurrency();
  const accounts = useAccountStore((s) => s.accounts);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const date = format(new Date(transaction.date), 'h:mm a');
  const isIncome = transaction.type === 'income';

  const isRedundant = transaction.description.trim().toLowerCase() === transaction.category.trim().toLowerCase();
  const subtitle = isRedundant
    ? date
    : `${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} · ${date}`;

  const txSource = transaction.source || 
    (transaction.id.startsWith('tx-ledger-') ? 'ledger' : 
     transaction.id.startsWith('tx-settled-') ? 'budget' : 'general');

  const badgeLabel =
    txSource === 'ledger' ? 'Ledger' :
    txSource === 'budget' ? 'Budget' :
    null;

  const badgeColor =
    txSource === 'ledger' ? '#8B5CF6' :
    txSource === 'budget' ? '#10B981' :
    (isIncome ? colors.status.income : colors.status.expense);

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
            ? (isDark ? colors.glass.background : 'rgba(0,0,0,0.03)')
            : 'transparent',
        },
      ]}
    >
      <CategoryIcon category={transaction.category} size={44} source={txSource} />

      <View style={styles.details}>
        {/* Title row — description + source badge inline */}
        <View style={styles.titleRow}>
          <AppText
            variant="labelLG"
            color={colors.text.primary}
            numberOfLines={1}
            style={styles.descriptionText}
          >
            {transaction.description}
          </AppText>
          {badgeLabel && (
            <View style={[styles.sourceBadge, { backgroundColor: badgeColor + '14' }]}>
              <AppText style={[styles.sourceBadgeText, { color: badgeColor }]}>
                {badgeLabel}
              </AppText>
            </View>
          )}
        </View>

        {/* Meta row — category · time + account badge */}
        <View style={styles.metaRow}>
          <AppText variant="caption" color={colors.text.tertiary} style={styles.metaText}>
            {subtitle}
          </AppText>
          {transaction.type === 'transfer' ? (
            (() => {
              const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;
              return (
                <View style={styles.transferRow}>
                  {account && (
                    <View style={[styles.accountBadge, { backgroundColor: isDark ? account.color + '18' : account.color + '0E', borderColor: isDark ? account.color + '35' : account.color + '22' }]}>
                      <Ionicons name={(account.icon || 'wallet-outline') as any} size={9} color={account.color} />
                      <AppText style={[styles.accountBadgeText, { color: account.color }]}>{account.name}</AppText>
                    </View>
                  )}
                  {toAccount && (
                    <>
                      <Ionicons name="arrow-forward" size={9} color={colors.text.tertiary} />
                      <View style={[styles.accountBadge, { backgroundColor: isDark ? toAccount.color + '18' : toAccount.color + '0E', borderColor: isDark ? toAccount.color + '35' : toAccount.color + '22' }]}>
                        <Ionicons name={(toAccount.icon || 'wallet-outline') as any} size={9} color={toAccount.color} />
                        <AppText style={[styles.accountBadgeText, { color: toAccount.color }]}>{toAccount.name}</AppText>
                      </View>
                    </>
                  )}
                </View>
              );
            })()
          ) : account ? (
            <View
              style={[
                styles.accountBadge,
                {
                  backgroundColor: isDark ? account.color + '18' : account.color + '0E',
                  borderColor:     isDark ? account.color + '35' : account.color + '22',
                },
              ]}
            >
              <Ionicons name={(account.icon || 'wallet-outline') as any} size={9} color={account.color} />
              <AppText style={[styles.accountBadgeText, { color: account.color }]}>
                {account.name}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right column — amount + optional balance */}
      <View style={styles.right}>
        {txSource === 'budget' || txSource === 'ledger' ? (
          <AppText variant="labelLG" color={colors.text.primary} style={styles.amountText}>
            {symbol}{transaction.amount.toFixed(2)}
          </AppText>
        ) : (
          <AmountText
            amount={transaction.amount}
            currency={transaction.currency}
            type={transaction.type === 'transfer' ? 'income' : transaction.type}
            variant="labelLG"
            showSign
          />
        )}
        {balanceAfter !== undefined && (
          <AppText variant="caption" color={colors.text.tertiary} style={styles.balanceText}>
            Bal: {formatCurrencyVal(balanceAfter, transaction.currency)}
          </AppText>
        )}
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

  /* Title row with description + source badge */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descriptionText: {
    fontWeight: '700',
    flexShrink: 1,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  /* Meta row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 1,
  },
  metaText: {
    fontSize: 11.5,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 999,
    borderWidth: 1,
  },
  accountBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  /* Right column */
  right: { alignItems: 'flex-end', gap: 2 },
  amountText: {
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
    opacity: 0.7,
  },
});
