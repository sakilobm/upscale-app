/**
 * @file index.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Home dashboard screen. Pure declarative orchestrator: reads a single
 *   contract from useHomeScreen and renders extracted components. Zero business logic,
 *   zero raw useState, zero store imports.
 * @associatedFiles src/features/dashboard/hooks/useHomeScreen.ts,
 *   src/components/home/ (QuickAddSheet, HomeSetupPrompt, SectionTitle)
 */

import {
  View, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useHomeScreen } from '@features/dashboard/hooks/useHomeScreen';
import { useNotificationStore } from '@store/notificationStore';
import { getAvatar } from '@constants/avatars';
import { QuickAddSheet } from '@components/home/QuickAddSheet';
import { TransferSheet } from '@components/home/TransferSheet';
import { EditTransactionSheet } from '@components/transactions/EditTransactionSheet';
import { HomeSetupPrompt } from '@components/home/HomeSetupPrompt';
import { SectionTitle } from '@components/home/SectionTitle';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Layout } from '@constants/index';
import { useLedgerStore, type LedgerEntry } from '@store/ledgerStore';
import { usePlannedPaymentsStore, type PlannedPayment } from '@store/plannedPaymentsStore';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function DashboardLedgerRow({ entry }: { entry: LedgerEntry }) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const remaining = entry.totalAmount - entry.amountReturned;
  const progressPct = entry.totalAmount > 0 ? entry.amountReturned / entry.totalAmount : 0;
  
  const isOwed = entry.direction === 'OWED_TO_ME';
  const labelText = entry.status === 'SETTLED' 
    ? 'Settled' 
    : isOwed ? 'Lent (They owe)' : 'Borrowed (You owe)';
  const labelColor = entry.status === 'SETTLED'
    ? colors.text.tertiary
    : '#8B5CF6';

  const amountColor = entry.status === 'SETTLED'
    ? colors.text.tertiary
    : colors.text.primary;

  return (
    <Pressable
      onPress={() => {
        router.push('/(tabs)/ledger');
      }}
      style={({ pressed }) => [
        s.ledgerRowContainer,
        {
          opacity: pressed ? 0.75 : 1,
        }
      ]}
    >
      {/* Avatar with Initials */}
      <View style={[s.ledgerAvatar, { backgroundColor: entry.personColor + '18', borderColor: entry.personColor + '30' }]}>
        <AppText style={[s.ledgerAvatarText, { color: entry.personColor }]}>
          {entry.personInitials}
        </AppText>
      </View>

      {/* Details */}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="labelMD" color={colors.text.primary} style={{ fontWeight: '600' }}>
            {entry.personName}
          </AppText>
          <AppText variant="labelMD" style={{ color: amountColor, fontWeight: '700' }}>
            {symbol}{remaining.toFixed(2)}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons 
              name={entry.status === 'SETTLED' ? 'checkmark-circle' : isOwed ? 'arrow-up-circle' : 'arrow-down-circle'} 
              size={11} 
              color={labelColor} 
            />
            <AppText variant="caption" style={{ color: labelColor, fontSize: 10, fontWeight: '600' }}>
              {labelText}
            </AppText>
          </View>
          {entry.status !== 'SETTLED' && (
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontSize: 9 }}>
              of {symbol}{entry.totalAmount.toFixed(0)}
            </AppText>
          )}
        </View>

        {/* Mini progress bar if active and partially returned */}
        {entry.status !== 'SETTLED' && progressPct > 0 && (
          <View style={[s.miniProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[s.miniProgressFill, { width: `${progressPct * 100}%`, backgroundColor: entry.personColor }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const BUDGET_CATEGORY_ICON: Record<string, IoniconName> = {
  housing: 'home-outline',
  food: 'restaurant-outline',
  transport: 'car-outline',
  health: 'fitness-outline',
  entertainment: 'film-outline',
  shopping: 'bag-handle-outline',
  education: 'school-outline',
  savings: 'wallet-outline',
  other: 'ellipsis-horizontal-outline',
};

function DashboardBudgetRow({ payment }: { payment: PlannedPayment }) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  
  const paid = payment.amountPaid ?? 0;
  const progressPct = payment.amount > 0 ? paid / payment.amount : 0;
  const isPaid = payment.status === 'SETTLED';

  const dotColor = isPaid 
    ? colors.status.income 
    : payment.status === 'OVERDUE' 
      ? colors.status.expense 
      : '#10B981';

  return (
    <Pressable
      onPress={() => {
        router.push('/(tabs)/budget');
      }}
      style={({ pressed }) => [
        s.budgetRowContainer,
        {
          opacity: pressed ? 0.75 : 1,
        }
      ]}
    >
      {/* Dynamic colored category circle */}
      <View style={[s.budgetCategoryIcon, { backgroundColor: dotColor + '18', borderColor: dotColor + '30' }]}>
        <Ionicons
          name={BUDGET_CATEGORY_ICON[payment.category] ?? 'ellipsis-horizontal-outline'}
          size={16}
          color={dotColor}
        />
      </View>

      {/* Details */}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="labelMD" color={colors.text.primary} style={{ fontWeight: '600' }}>
            {payment.title}
          </AppText>
          <AppText variant="labelMD" style={{ color: colors.text.primary, fontWeight: '700' }}>
            {symbol}{payment.amount.toFixed(2)}
          </AppText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {isPaid ? (
              <>
                <Ionicons name="checkmark-circle" size={11} color={colors.status.income} />
                <AppText variant="caption" style={{ color: colors.status.income, fontSize: 10, fontWeight: '600' }}>
                  Paid
                </AppText>
              </>
            ) : (
              <>
                <Ionicons 
                  name={payment.status === 'OVERDUE' ? 'alert-circle' : 'time-outline'} 
                  size={11} 
                  color={dotColor} 
                />
                <AppText variant="caption" style={{ color: dotColor, fontSize: 10, fontWeight: '600' }}>
                  {payment.status === 'OVERDUE' ? 'Overdue' : 'Upcoming'}
                </AppText>
              </>
            )}
          </View>
          {paid > 0 && !isPaid && (
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontSize: 9 }}>
              Spent {symbol}{paid.toFixed(0)} of {symbol}{payment.amount.toFixed(0)}
            </AppText>
          )}
        </View>

        {/* Mini progress bar if active and partially paid */}
        {paid > 0 && !isPaid && (
          <View style={[s.miniProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[s.miniProgressFill, { width: `${progressPct * 100}%`, backgroundColor: '#10B981' }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dashboard, user, addSheet, transferSheet, quickActions, handleTransactionPress, editingTransaction, setEditingTransaction } = useHomeScreen();
  const ledgerEntries = useLedgerStore((s) => s.entries);
  const activeLedgerEntries = ledgerEntries.filter(entry => entry.status !== 'SETTLED');
  const settledLedgerEntries = ledgerEntries.filter(entry => entry.status === 'SETTLED');
  const displayLedgerEntries = [...activeLedgerEntries, ...settledLedgerEntries].slice(0, 5);

  const plannedPayments = usePlannedPaymentsStore((s) => s.payments);
  const upcomingPayments = plannedPayments.filter(p => p.status !== 'SETTLED');
  const settledPayments = plannedPayments.filter(p => p.status === 'SETTLED');
  const displayPayments = [...upcomingPayments, ...settledPayments].slice(0, 5);

  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.isRead).length);
  const { data, isLoading, isError, isEmpty, refresh } = dashboard;
  const avatar = getAvatar(user.avatarId);

  if (isError) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background.primary }]}>
        <EmptyState emoji="⚠️" title="Something went wrong" subtitle="Pull down to retry" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && data !== null}
            onRefresh={refresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <LinearGradient colors={avatar.gradient} style={s.avatar}>
            <AppText style={s.avatarEmoji}>{avatar.emoji}</AppText>
          </LinearGradient>

          <View style={s.greetingBlock}>
            <AppText variant="caption" color={colors.text.tertiary}>Good day,</AppText>
            <AppText variant="headingSM" color={colors.text.primary} style={s.greetingName}>
              {user.firstName} 👋
            </AppText>
          </View>

          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [
              s.headerAction,
              {
                backgroundColor: isDark ? colors.glass.backgroundMid : colors.background.secondary,
                borderColor: isDark ? colors.glass.border : colors.glass.borderStrong,
                opacity: pressed ? 0.65 : 1,
                ...Platform.select({
                  ios: { shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.07, shadowRadius: 6 },
                  android: { elevation: isDark ? 0 : 2 },
                }),
              },
            ]}
          >
            <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={19} color={colors.text.primary} />
            {unreadCount > 0 && (
              <View style={[s.bellBadge, { backgroundColor: colors.status.expense }]}>
                <AppText style={[s.bellBadgeText, { color: colors.white }]}>{unreadCount > 9 ? '9+' : unreadCount}</AppText>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Balance card label ── */}
        <View style={s.sectionHeader}>
          <AppText variant="labelMD" color={colors.text.secondary}>Your Card</AppText>
          <Pressable onPress={() => router.push('/accounts')}>
            <AppText variant="labelSM" color={colors.brand.accent}>Manage</AppText>
          </Pressable>
        </View>

        <BalanceCard
          totalBalance={data?.totalBalance ?? 0}
          monthSummary={data?.monthSummary ?? { month: '', totalIncome: 0, totalExpense: 0, netSavings: 0, transactionCount: 0 }}
          isLoading={isLoading && data === null}
          currency={user.currency}
        />

        {/* ── Quick Actions ── */}
        <View style={s.actionsRow}>
          {quickActions.map(({ icon, label, color, action }) => (
            <Pressable
              key={label}
              onPress={action}
              style={({ pressed }) => [s.actionItem, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={[s.actionIconOuter, { borderColor: color + '55' }]}>
                <View style={s.actionIconClip}>
                  <BlurView intensity={isDark ? 50 : 70} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={[color + '70', color + '28']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.00)']} start={{ x: 0, y: 0 }} end={{ x: 0.6, y: 1 }} style={s.actionIconShine} />
                  <Ionicons name={icon as IoniconName} size={24} color={color} />
                </View>
              </View>
              <AppText variant="caption" style={[s.actionLabel, { color: colors.text.secondary }]}>{label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* ── Data or Setup Prompt ── */}
        {isEmpty ? (
          <View style={s.section}>
            <HomeSetupPrompt onLogExpense={() => addSheet.open('expense')} />
          </View>
        ) : (
          <>
            {data && (
              <View style={s.section}>
                <SectionTitle title="This Month" />
                <View style={s.statsRow}>
                  <QuickStatCard label="Income" amount={data.monthSummary.totalIncome} type="income" iconEmoji="💰" currency={user.currency} />
                  <QuickStatCard label="Expenses" amount={data.monthSummary.totalExpense} type="expense" iconEmoji="💸" currency={user.currency} />
                </View>

                {/* Analytics CTA */}
                <Pressable
                  onPress={() => router.push('/analytics')}
                  style={({ pressed }) => [s.analyticsCta, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <LinearGradient
                    colors={isDark ? ['rgba(108,99,255,0.12)', 'rgba(56,189,248,0.08)'] : ['rgba(108,99,255,0.08)', 'rgba(56,189,248,0.05)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                  />
                  <View style={[s.analyticsCtaIcon, { backgroundColor: colors.brand.primary + '18' }]}>
                    <Ionicons name="analytics" size={18} color={colors.brand.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <AppText variant="labelMD" color={colors.text.primary} style={{ fontWeight: '700' }}>
                      Full Analytics
                    </AppText>
                    <AppText variant="caption" color={colors.text.tertiary}>
                      Charts, trends, insights & growth metrics
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
                </Pressable>
              </View>
            )}

            {data && data.spendingByCategory.length > 0 && (
              <View style={s.section}>
                <SectionTitle
                  title="Where it went"
                  action="See all"
                  onAction={() => router.push('/(tabs)/transactions')}
                />
                <View style={s.subSectionHeader}>
                  <Ionicons name="pie-chart-outline" size={12} color={colors.status.expense} />
                  <AppText variant="labelSM" style={{ color: colors.status.expense, fontWeight: '700', fontSize: 10, letterSpacing: 0.8 }}>
                    SPENDING BY CATEGORY
                  </AppText>
                </View>
                <SpendingChart data={data.spendingByCategory} isLoading={isLoading} />
              </View>
            )}

            {data && data.recentTransactions.length > 0 && (() => {
              const recentTxs = data.recentTransactions.slice(0, 5);

              return (
                <View style={s.section}>
                  <SectionTitle title="Recent Activity" action="See all" onAction={() => router.push('/(tabs)/transactions')} />

                  {recentTxs.length > 0 && (
                    <View style={{ marginBottom: Spacing['4'] }}>
                      <AppText variant="labelSM" color={colors.text.tertiary} style={s.subSectionTitle}>
                        RECENT TRANSACTIONS
                      </AppText>
                      <GlassCard padding={0}>
                        {recentTxs.map((tx, idx) => (
                          <View key={tx.id} style={[s.txRow, { borderBottomColor: colors.glass.border }, idx === recentTxs.length - 1 && s.txRowLast]}>
                            <RecentTransactionRow
                              transaction={tx}
                              onPress={handleTransactionPress}
                              balanceAfter={data?.runningBalances?.get(tx.id)}
                            />
                          </View>
                        ))}
                      </GlassCard>
                    </View>
                  )}

                  {displayPayments.length > 0 && (
                    <View style={{ marginBottom: Spacing['4'] }}>
                      <View style={s.subSectionHeader}>
                        <Ionicons name="receipt-outline" size={12} color="#10B981" />
                        <AppText variant="labelSM" style={{ color: '#10B981', fontWeight: '700', fontSize: 10, letterSpacing: 0.8 }}>
                          BUDGETS & PLANNED PAYMENTS
                        </AppText>
                      </View>
                      <GlassCard padding={0} style={{ borderColor: '#10B981' + '30', borderWidth: 1 }}>
                        {displayPayments.map((payment, idx) => (
                          <View key={payment.id} style={[s.txRow, { borderBottomColor: colors.glass.border }, idx === displayPayments.length - 1 && s.txRowLast]}>
                            <DashboardBudgetRow payment={payment} />
                          </View>
                        ))}
                      </GlassCard>
                    </View>
                  )}

                  {displayLedgerEntries.length > 0 && (
                    <View style={{ marginBottom: Spacing['4'] }}>
                      <View style={s.subSectionHeader}>
                        <Ionicons name="people-outline" size={12} color="#8B5CF6" />
                        <AppText variant="labelSM" style={{ color: '#8B5CF6', fontWeight: '700', fontSize: 10, letterSpacing: 0.8 }}>
                          LEDGER DEBTS & LOANS
                        </AppText>
                      </View>
                      <GlassCard padding={0} style={{ borderColor: '#8B5CF6' + '30', borderWidth: 1 }}>
                        {displayLedgerEntries.map((entry, idx) => (
                          <View key={entry.id} style={[s.txRow, { borderBottomColor: colors.glass.border }, idx === displayLedgerEntries.length - 1 && s.txRowLast]}>
                            <DashboardLedgerRow entry={entry} />
                          </View>
                        ))}
                      </GlassCard>
                    </View>
                  )}
                </View>
              );
            })()}
          </>
        )}
      </ScrollView>

      <QuickAddSheet visible={addSheet.isVisible} initialType={addSheet.type} onClose={addSheet.close} />
      <TransferSheet visible={transferSheet.isVisible} onClose={transferSheet.close} />
      <EditTransactionSheet visible={!!editingTransaction} transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['3'] },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing['5'], gap: Spacing['3'] },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarEmoji: { fontSize: 24, lineHeight: 30 },
  greetingBlock: { flex: 1, gap: 1 },
  greetingName: { lineHeight: 22 },
  headerAction: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { fontSize: 9, fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['3'] },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing['5'], marginBottom: Spacing['2'] },
  actionItem: { flex: 1, alignItems: 'center', gap: 7 },
  actionIconOuter: { width: 62, height: 62, borderRadius: 20, borderWidth: 1.5, padding: 2 },
  actionIconClip: { flex: 1, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  actionIconShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 30, borderBottomLeftRadius: 10, borderBottomRightRadius: 16 },
  actionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  section: { marginTop: Spacing['6'] },
  statsRow: { flexDirection: 'row', gap: Spacing['3'] },
  txRow: { borderBottomWidth: StyleSheet.hairlineWidth },
  txRowLast: { borderBottomWidth: 0 },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: Spacing['2'],
    marginLeft: 2,
  },
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing['2'],
    marginLeft: 2,
  },
  ledgerRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    minHeight: 68,
  },
  ledgerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ledgerAvatarText: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniProgressTrack: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: 3,
    borderRadius: 1.5,
  },
  budgetRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    minHeight: 68,
  },
  budgetCategoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  analyticsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    padding: Spacing['3'] + 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: Spacing['3'],
  },
  analyticsCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
