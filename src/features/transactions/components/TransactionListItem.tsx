import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { triggerAppHaptic } from '@/services/hapticsService';
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
  const categoryLabel = !isRedundant
    ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)
    : null;

  const txSource = transaction.source || 
    (transaction.id.startsWith('tx-ledger-') ? 'ledger' : 
     transaction.id.startsWith('tx-settled-') ? 'budget' : 'general');

  const badgeLabel =
    txSource === 'ledger' ? 'Ledger' :
    txSource === 'budget' ? 'Budget' :
    txSource === 'loan' ? 'Loan' :
    null;

  const badgeColor =
    txSource === 'ledger' ? '#8B5CF6' :
    txSource === 'budget' ? '#10B981' :
    txSource === 'loan' ? '#3B82F6' :
    (isIncome ? colors.status.income : colors.status.expense);

  const rightMeta = balanceAfter !== undefined
    ? `${date} · Bal: ${formatCurrencyVal(balanceAfter, transaction.currency)}`
    : date;

  return (
    <Pressable
      onPress={() => onPress(transaction)}
      onLongPress={() => {
        triggerAppHaptic('medium', 'button');
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
        {/* Title row — description only (clean and uncluttered) */}
        <View style={styles.titleRow}>
          <AppText
            variant="labelLG"
            color={colors.text.primary}
            numberOfLines={1}
            style={styles.descriptionText}
          >
            {transaction.description}
          </AppText>
        </View>

        {/* Meta row — category + account text + source badge */}
        <View style={styles.metaRow}>
          {categoryLabel && (
            <AppText variant="caption" color={colors.text.tertiary} style={styles.metaText}>
              {categoryLabel}
            </AppText>
          )}
          {categoryLabel && (account || transaction.type === 'transfer') && (
            <AppText variant="caption" color={colors.text.tertiary} style={styles.separatorText}>
              ·
            </AppText>
          )}
          {transaction.type === 'transfer' ? (
            (() => {
              const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;
              return (
                <View style={styles.transferTextRow}>
                  {account && (
                    <AppText variant="caption" style={{ color: account.color, fontWeight: '700', fontSize: 10.5 }}>
                      {account.name}
                    </AppText>
                  )}
                  <Ionicons name="arrow-forward" size={9} color={colors.text.tertiary} style={{ marginHorizontal: 3 }} />
                  {toAccount && (
                    <AppText variant="caption" style={{ color: toAccount.color, fontWeight: '700', fontSize: 10.5 }}>
                      {toAccount.name}
                    </AppText>
                  )}
                </View>
              );
            })()
          ) : account ? (
            <AppText variant="caption" style={{ color: account.color, fontWeight: '700', fontSize: 10.5 }}>
              {account.name}
            </AppText>
          ) : null}

          {badgeLabel && (
            <>
              <AppText variant="caption" color={colors.text.tertiary} style={styles.separatorText}>
                ·
              </AppText>
              <View style={[styles.sourceBadge, { backgroundColor: badgeColor + '12' }]}>
                <AppText style={[styles.sourceBadgeText, { color: badgeColor }]}>
                  {badgeLabel}
                </AppText>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Right column — amount + time & optional balance */}
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
        <AppText variant="caption" color={colors.text.tertiary} style={styles.rightMetaText}>
          {rightMeta}
        </AppText>
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
  details: { flex: 1, gap: 2 },

  /* Title row with description */
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  descriptionText: {
    fontWeight: '600',
    flexShrink: 1,
  },
  sourceBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  sourceBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Meta row */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  separatorText: {
    fontSize: 11,
    opacity: 0.5,
  },
  transferTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* Right column */
  right: { alignItems: 'flex-end', justifyContent: 'center', gap: 3 },
  amountText: {
    fontWeight: '600',
  },
  rightMetaText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
