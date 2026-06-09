import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { LoadingScreen } from '@components/LoadingScreen';
import { EmptyState } from '@components/EmptyState';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAccountStore } from '@store/accountStore';
import { useAuthStore } from '@store/authStore';
import type { Transaction } from '@store/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { icon: IoniconName; label: string; filled: boolean }[] = [
  { icon: 'arrow-up',              label: 'Send',    filled: true  },
  { icon: 'arrow-down-outline',    label: 'Top Up',  filled: false },
  { icon: 'shuffle-outline',       label: 'Split',   filled: false },
  { icon: 'document-text-outline', label: 'Request', filled: false },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { data, isLoading, isError, refresh } = useDashboardData();
  const user = useAuthStore((s) => s.user);

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    router.push('/transactions');
  }, []);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AM';

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
        <EmptyState emoji="⚠️" title="Something went wrong" subtitle="Pull down to retry" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && data !== null}
            onRefresh={refresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: isDark ? colors.brand.primary + '30' : '#0A0A0A' }]}>
            <AppText style={[styles.avatarText, { color: isDark ? colors.text.primary : '#FFFFFF' }]}>
              {initials}
            </AppText>
          </View>
          <View style={styles.headerCenter}>
            <AppText variant="caption" color={colors.text.secondary} style={styles.greeting}>
              Welcome Back,
            </AppText>
            <AppText variant="headingSM" color={colors.text.primary} style={styles.userName}>
              {user?.fullName?.split(' ')[0] ?? 'Alex'} {user?.fullName?.split(' ')[1] ?? 'Morgan'}
            </AppText>
          </View>
          <Pressable
            style={[styles.bellBtn, { backgroundColor: isDark ? colors.glass.background : colors.background.secondary, borderColor: colors.glass.border }]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Card section header */}
        <View style={styles.cardHeader}>
          <AppText variant="labelMD" color={colors.text.secondary}>MoneyCard</AppText>
          <Pressable style={styles.addCardBtn}>
            <Ionicons name="add-circle-outline" size={16} color={colors.text.secondary} />
            <AppText variant="labelSM" color={colors.text.secondary}> Add Card</AppText>
          </Pressable>
        </View>

        {/* Balance Card */}
        <BalanceCard
          totalBalance={data?.totalBalance ?? 0}
          monthSummary={data?.monthSummary ?? {
            month: '',
            totalIncome: 0,
            totalExpense: 0,
            netSavings: 0,
            transactionCount: 0,
          }}
          isLoading={isLoading}
        />

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map(({ icon, label, filled }) => {
            const btnBg = filled
              ? (isDark ? colors.brand.primary : '#0A0A0A')
              : (isDark ? colors.glass.background : colors.background.secondary);
            const btnBorder = filled ? 'transparent' : colors.glass.border;
            const iconColor = filled
              ? (isDark ? colors.text.inverse : '#FFFFFF')
              : colors.text.primary;

            return (
              <Pressable
                key={label}
                style={({ pressed }) => [
                  styles.actionItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    {
                      backgroundColor: btnBg,
                      borderColor: btnBorder,
                      borderWidth: filled ? 0 : 1,
                      shadowColor: filled && !isDark ? '#000' : colors.brand.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: filled ? 0.18 : 0,
                      shadowRadius: 8,
                      elevation: filled ? 4 : 0,
                    },
                  ]}
                >
                  <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <AppText variant="caption" color={colors.text.secondary} style={styles.actionLabel}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Quick Stats */}
        {data && (
          <View style={styles.section}>
            <AppText variant="headingSM" color={colors.text.primary} style={styles.sectionTitle}>
              This Month
            </AppText>
            <View style={styles.statsRow}>
              <QuickStatCard
                label="Income"
                amount={data.monthSummary.totalIncome}
                type="income"
                iconEmoji="💰"
              />
              <QuickStatCard
                label="Expenses"
                amount={data.monthSummary.totalExpense}
                type="expense"
                iconEmoji="💸"
              />
            </View>
          </View>
        )}

        {/* Spending Chart */}
        <View style={styles.section}>
          <AppText variant="headingSM" color={colors.text.primary} style={styles.sectionTitle}>
            Where it went
          </AppText>
          <SpendingChart data={data?.spendingByCategory ?? []} isLoading={isLoading} />
        </View>

        {/* Recent Transactions */}
        {data && data.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="headingSM" color={colors.text.primary}>
                Recent Activity
              </AppText>
              <Pressable onPress={() => router.push('/transactions')}>
                <AppText variant="labelMD" color={colors.brand.accent}>
                  See all
                </AppText>
              </Pressable>
            </View>
            <GlassCard padding={0}>
              {data.recentTransactions.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <RecentTransactionRow
                    transaction={tx}
                    onPress={handleTransactionPress}
                  />
                </View>
              ))}
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['5'],
    gap: Spacing['3'],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerCenter: {
    flex: 1,
    gap: 1,
  },
  greeting: {
    lineHeight: 16,
  },
  userName: {
    lineHeight: 22,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing['5'],
    marginBottom: Spacing['2'],
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing['2'],
    flex: 1,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    letterSpacing: 0.2,
  },
  section: {
    marginTop: Spacing['6'],
  },
  sectionTitle: {
    marginBottom: Spacing['3'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  txRow: {
    paddingHorizontal: Spacing['4'],
  },
});
