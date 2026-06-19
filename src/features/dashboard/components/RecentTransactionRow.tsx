import React, { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { CategoryIcon } from '@components/CategoryIcon';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAccountStore } from '@store/accountStore';
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
  const accounts = useAccountStore((s) => s.accounts);
  const account = accounts.find((a) => a.id === transaction.accountId);
  const formattedDate = format(new Date(transaction.date), 'MMM d');

  const isRedundant = transaction.description.trim().toLowerCase() === transaction.category.trim().toLowerCase();
  const subtitle = isRedundant
    ? formattedDate
    : `${transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)} · ${formattedDate}`;

  const txSource = transaction.source || 
    (transaction.id.startsWith('tx-ledger-') ? 'ledger' : 
     transaction.id.startsWith('tx-settled-') ? 'budget' : 'general');

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
      <CategoryIcon category={transaction.category} size={44} source={txSource} />
      <View style={styles.details}>
        <AppText
          variant="labelMD"
          color={colors.text.primary}
          numberOfLines={1}
          style={styles.description}
        >
          {transaction.description}
        </AppText>
        <View style={styles.metaRow}>
          <AppText variant="caption" color={colors.text.tertiary}>
            {subtitle}
          </AppText>
          {transaction.type === 'transfer' ? (
            (() => {
              const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {account && (
                    <View style={[styles.accountBadge, { backgroundColor: isDark ? account.color + '22' : account.color + '15', borderColor: isDark ? account.color + '44' : account.color + '30' }]}>
                      <Ionicons name={(account.icon || 'wallet-outline') as any} size={9} color={account.color} />
                      <AppText style={[styles.accountBadgeText, { color: account.color }]}>{account.name}</AppText>
                    </View>
                  )}
                  {toAccount && (
                    <>
                      <Ionicons name="arrow-forward" size={9} color={colors.text.tertiary} />
                      <View style={[styles.accountBadge, { backgroundColor: isDark ? toAccount.color + '22' : toAccount.color + '15', borderColor: isDark ? toAccount.color + '44' : toAccount.color + '30' }]}>
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
                  backgroundColor: isDark ? account.color + '22' : account.color + '15',
                  borderColor:     isDark ? account.color + '44' : account.color + '30',
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
    minHeight:      68,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  description: {
    fontWeight: '600',
  },
});
