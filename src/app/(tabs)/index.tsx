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
import { QuickAddSheet } from '@components/home/QuickAddSheet';
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
import { toast } from '@store/toastStore';
import { Spacing, Layout } from '@constants/index';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { dashboard, user, addSheet, quickActions, handleTransactionPress } = useHomeScreen();
  const { data, isLoading, isError, isEmpty, refresh } = dashboard;

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
          <View style={[
            s.avatar,
            {
              backgroundColor: isDark ? colors.brand.primary + '28' : colors.brand.primary,
              borderColor:     isDark ? colors.brand.primary + '55' : 'transparent',
            },
          ]}>
            <AppText style={[s.avatarText, { color: isDark ? colors.brand.primary : '#000000' }]}>
              {user.initials}
            </AppText>
          </View>

          <View style={s.greetingBlock}>
            <AppText variant="caption" color={colors.text.tertiary}>Good day,</AppText>
            <AppText variant="headingSM" color={colors.text.primary} style={s.greetingName}>
              {user.firstName} 👋
            </AppText>
          </View>

          <Pressable
            onPress={() => toast.info('No new notifications')}
            style={({ pressed }) => [
              s.headerAction,
              {
                backgroundColor: isDark ? colors.glass.backgroundMid : '#FFFFFF',
                borderColor:     isDark ? colors.glass.border : 'rgba(0,0,0,0.08)',
                opacity: pressed ? 0.65 : 1,
                ...Platform.select({
                  ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.07, shadowRadius: 6 },
                  android: { elevation: isDark ? 0 : 2 },
                }),
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.text.primary} />
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
                  <QuickStatCard label="Income"   amount={data.monthSummary.totalIncome}  type="income"  iconEmoji="💰" />
                  <QuickStatCard label="Expenses" amount={data.monthSummary.totalExpense} type="expense" iconEmoji="💸" />
                </View>
              </View>
            )}

            {data && data.spendingByCategory.length > 0 && (
              <View style={s.section}>
                <SectionTitle title="Where it went" />
                <SpendingChart data={data.spendingByCategory} isLoading={isLoading} />
              </View>
            )}

            {data && data.recentTransactions.length > 0 && (
              <View style={s.section}>
                <SectionTitle title="Recent Activity" action="See all" onAction={() => router.push('/(tabs)/transactions')} />
                <GlassCard padding={0}>
                  {data.recentTransactions.map((tx, idx) => (
                    <View key={tx.id} style={[s.txRow, idx === data.recentTransactions.length - 1 && s.txRowLast]}>
                      <RecentTransactionRow transaction={tx} onPress={handleTransactionPress} />
                    </View>
                  ))}
                </GlassCard>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <QuickAddSheet visible={addSheet.isVisible} initialType={addSheet.type} onClose={addSheet.close} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll:   { paddingHorizontal: Spacing['5'], paddingTop: Spacing['3'] },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing['5'], gap: Spacing['3'] },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  greetingBlock: { flex: 1, gap: 1 },
  greetingName:  { lineHeight: 22 },
  headerAction:  { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['3'] },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing['5'], marginBottom: Spacing['2'] },
  actionItem: { flex: 1, alignItems: 'center', gap: 7 },
  actionIconOuter: { width: 62, height: 62, borderRadius: 20, borderWidth: 1.5, padding: 2 },
  actionIconClip:  { flex: 1, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  actionIconShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 30, borderBottomLeftRadius: 10, borderBottomRightRadius: 16 },
  actionLabel:     { fontSize: 11, fontWeight: '600', textAlign: 'center' },

  section:  { marginTop: Spacing['6'] },
  statsRow: { flexDirection: 'row', gap: Spacing['3'] },
  txRow:    { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.12)' },
  txRowLast: { borderBottomWidth: 0 },
});
