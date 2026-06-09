import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { AccountChip } from '@features/dashboard/components/AccountChip';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { LoadingScreen } from '@components/LoadingScreen';
import { EmptyState } from '@components/EmptyState';
import { Colors, Spacing, Layout } from '@constants/index';
import { useAccountStore } from '@store/accountStore';
import { useAuthStore } from '@store/authStore';
import type { Transaction } from '@store/types';

const SCREEN_CONSTANTS = {
  greeting: (name: string) => `Hello, ${name.split(' ')[0]} 👋`,
  sectionTitles: {
    accounts: 'Accounts',
    quickStats: 'This Month',
    recent: 'Recent Activity',
    spending: 'Where it went',
  },
} as const;

export default function HomeScreen() {
  const { data, isLoading, isError, refresh } = useDashboardData();
  const accounts = useAccountStore((s) => s.accounts);
  const activeAccountId = useAccountStore((s) => s.activeAccountId);
  const setActiveAccount = useAccountStore((s) => s.setActiveAccount);
  const user = useAuthStore((s) => s.user);

  const handleTransactionPress = useCallback((tx: Transaction) => {
    // Navigate to transaction detail — extend with expo-router dynamic route later
    router.push('/transactions');
  }, []);

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          emoji="⚠️"
          title="Something went wrong"
          subtitle="Pull down to retry"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
            tintColor={Colors.brand.secondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="bodySM" color={Colors.text.secondary}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </AppText>
            <AppText variant="headingMD" color={Colors.text.primary}>
              {user ? SCREEN_CONSTANTS.greeting(user.fullName) : 'Welcome back 👋'}
            </AppText>
          </View>
          <View style={styles.avatarPlaceholder}>
            <AppText style={styles.avatarText}>
              {user?.fullName?.charAt(0) ?? 'A'}
            </AppText>
          </View>
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

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <AppText variant="headingSM" style={styles.sectionTitle}>
              {SCREEN_CONSTANTS.sectionTitles.accounts}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsRow}
            >
              {accounts.map((acc) => (
                <AccountChip
                  key={acc.id}
                  account={acc}
                  isActive={acc.id === activeAccountId}
                  onPress={() => setActiveAccount(acc.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Stats */}
        {data && (
          <View style={styles.section}>
            <AppText variant="headingSM" style={styles.sectionTitle}>
              {SCREEN_CONSTANTS.sectionTitles.quickStats}
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
          <AppText variant="headingSM" style={styles.sectionTitle}>
            {SCREEN_CONSTANTS.sectionTitles.spending}
          </AppText>
          <SpendingChart
            data={data?.spendingByCategory ?? []}
            isLoading={isLoading}
          />
        </View>

        {/* Recent Transactions */}
        {data && data.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="headingSM">
                {SCREEN_CONSTANTS.sectionTitles.recent}
              </AppText>
              <Pressable onPress={() => router.push('/transactions')}>
                <AppText variant="labelMD" color={Colors.brand.secondary}>
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
    backgroundColor: Colors.background.primary,
  },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['5'],
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brand.primary + '40',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    color: Colors.white,
    fontWeight: '700',
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
  accountsRow: {
    gap: Spacing['3'],
    paddingBottom: Spacing['1'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  txRow: {
    paddingHorizontal: Spacing['4'],
  },
});
