import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@store/authStore';
import type { Transaction } from '@store/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const QUICK_ACTIONS: { icon: IoniconName; label: string }[] = [
  { icon: 'arrow-up', label: 'Send' },
  { icon: 'arrow-down-outline', label: 'Top Up' },
  { icon: 'shuffle-outline', label: 'Split' },
  { icon: 'document-text-outline', label: 'Request' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { data, isLoading, isError, refresh } = useDashboardData();
  const user = useAuthStore((s) => s.user);

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    router.push('/transactions');
  }, []);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Sakil';
  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'SK';

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
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDark
                  ? colors.brand.primary + '28'
                  : colors.brand.primary,
                borderColor: isDark
                  ? colors.brand.primary + '55'
                  : 'transparent',
              },
            ]}
          >
            <AppText
              style={[
                styles.avatarText,
                { color: isDark ? colors.brand.primary : '#000000' },
              ]}
            >
              {initials}
            </AppText>
          </View>

          {/* Greeting */}
          <View style={styles.greetingBlock}>
            <AppText variant="caption" color={colors.text.tertiary}>
              Good day,
            </AppText>
            <AppText
              variant="headingSM"
              color={colors.text.primary}
              style={styles.greetingName}
            >
              {firstName} 👋
            </AppText>
          </View>

          {/* Bell */}
          <Pressable
            style={({ pressed }) => [
              styles.headerAction,
              {
                backgroundColor: isDark
                  ? colors.glass.backgroundMid
                  : '#FFFFFF',
                borderColor: isDark
                  ? colors.glass.border
                  : 'rgba(0,0,0,0.08)',
                opacity: pressed ? 0.65 : 1,
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.07,
                    shadowRadius: 6,
                  },
                  android: { elevation: isDark ? 0 : 2 },
                }),
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* ── Balance card label ──────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText variant="labelMD" color={colors.text.secondary}>Your Card</AppText>
          <Pressable>
            <AppText variant="labelSM" color={colors.brand.accent}>Manage</AppText>
          </Pressable>
        </View>

        {/* ── Balance Card ─────────────────────────────────────────────── */}
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

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          {QUICK_ACTIONS.map(({ icon, label }, i) => {
            const isPrimary = i === 0;
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
                      backgroundColor: isPrimary
                        ? isDark ? colors.brand.primary : '#111827'
                        : isDark
                          ? colors.glass.backgroundMid
                          : '#FFFFFF',
                      borderWidth: isPrimary ? 0 : 1,
                      borderColor: isDark
                        ? colors.glass.border
                        : 'rgba(0,0,0,0.08)',
                      ...Platform.select({
                        ios: {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: isPrimary ? 4 : 2 },
                          shadowOpacity: isPrimary ? (isDark ? 0.4 : 0.20) : 0.06,
                          shadowRadius: isPrimary ? 10 : 6,
                        },
                        android: { elevation: isPrimary ? 6 : 2 },
                      }),
                    },
                  ]}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={isPrimary
                      ? isDark ? '#000' : '#FFFFFF'
                      : colors.text.primary}
                  />
                </View>
                <AppText variant="caption" color={colors.text.secondary} style={styles.actionLabel}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* ── This Month ────────────────────────────────────────────────── */}
        {data && (
          <View style={styles.section}>
            <SectionTitle title="This Month" />
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

        {/* ── Spending Chart ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="Where it went" />
          <SpendingChart data={data?.spendingByCategory ?? []} isLoading={isLoading} />
        </View>

        {/* ── Recent Activity ───────────────────────────────────────────── */}
        {data && data.recentTransactions.length > 0 && (
          <View style={styles.section}>
            <SectionTitle
              title="Recent Activity"
              action="See all"
              onAction={() => router.push('/transactions')}
            />
            <GlassCard padding={0}>
              {data.recentTransactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    idx === data.recentTransactions.length - 1 && styles.txRowLast,
                  ]}
                >
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

// ─── Section title helper ─────────────────────────────────────────────────────

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <AppText variant="headingSM" color={colors.text.primary}>
        {title}
      </AppText>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <AppText variant="labelMD" color={colors.brand.accent}>
            {action}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
  },
  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['5'],
    gap: Spacing['3'],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingBlock: {
    flex: 1,
    gap: 1,
  },
  greetingName: {
    lineHeight: 22,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Card label
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  // ── Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing['5'],
    marginBottom: Spacing['1'],
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing['2'],
    flex: 1,
  },
  actionIconBox: {
    width: 54,
    height: 54,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  // ── Sections
  section: {
    marginTop: Spacing['6'],
  },
  sectionTitleRow: {
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
  txRowLast: {
    // remove the hairline border on the last item
    borderBottomWidth: 0,
  },
});
