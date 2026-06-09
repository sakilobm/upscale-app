import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@components/AppHeader';
import { useBudgets } from '@features/budget/hooks/useBudgets';
import { ProgressRingMatrix } from '@features/budget/components/ProgressRingMatrix';
import { PlannedPaymentsTimeline } from '@features/budget/components/PlannedPaymentsTimeline';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { EmptyState } from '@components/EmptyState';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { Budget } from '@store/types';

export default function BudgetScreen() {
  const { colors, isDark } = useTheme();
  const { data: budgetsData, isLoading, isEmpty, refresh, summary } = useBudgets();
  const budgets = budgetsData ?? [];

  const payments       = usePlannedPaymentsStore((s) => s.payments);
  const settlePayment  = usePlannedPaymentsStore((s) => s.settlePayment);
  const deletePayment  = usePlannedPaymentsStore((s) => s.deletePayment);

  const overviewGradient: [string, string] =
    summary && summary.percentUsed > 100
      ? [colors.status.expense, colors.status.expense]
      : [colors.brand.primary, colors.brand.accent];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        <AppHeader
          title="Budget"
          subtitle="Monthly spending limits"
        />

        {/* Monthly overview card */}
        {summary && (
          <GlassCard padding={Spacing['5']} borderRadius={Radius.xl} borderGlow style={styles.overviewCard}>
            <AppText variant="labelMD" color={colors.text.secondary}>Monthly Overview</AppText>
            <View style={styles.overviewRow}>
              <View>
                <AppText variant="numericLG" color={colors.text.primary}>
                  ${summary.totalSpent.toFixed(0)}
                </AppText>
                <AppText variant="caption" color={colors.text.secondary}>
                  of ${summary.totalLimit.toFixed(0)} total
                </AppText>
              </View>
              <View style={styles.overviewRight}>
                <AppText
                  variant="headingMD"
                  color={summary.percentUsed > 100 ? colors.status.expense : colors.status.income}
                >
                  {summary.percentUsed.toFixed(0)}%
                </AppText>
                {summary.overBudgetCount > 0 && (
                  <View style={[styles.overBudgetBadge, { backgroundColor: colors.status.expense + '20' }]}>
                    <AppText variant="caption" color={colors.status.expense}>
                      {summary.overBudgetCount} over budget
                    </AppText>
                  </View>
                )}
              </View>
            </View>
            <ProgressBar
              progress={Math.min(summary.percentUsed / 100, 1)}
              gradient={overviewGradient}
              height={8}
              style={styles.overviewBar}
            />
          </GlassCard>
        )}

        {/* Progress Ring Matrix */}
        {isLoading && !budgets.length ? (
          <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
        ) : isEmpty ? (
          <EmptyState
            emoji="🎯"
            title="No budgets set"
            subtitle="Set spending limits to track your habits."
          />
        ) : (
          <ProgressRingMatrix budgets={budgets} />
        )}

        {/* Planned Payments Timeline */}
        {payments.length > 0 && (
          <View style={styles.timelineWrapper}>
            <PlannedPaymentsTimeline
              payments={payments}
              onSettle={settlePayment}
              onDelete={deletePayment}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['2'],
    gap:               Spacing['4'],
  },
  overviewCard: {},
  overviewRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginVertical: Spacing['3'],
  },
  overviewRight: { alignItems: 'flex-end', gap: 4 },
  overBudgetBadge: {
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderRadius:      999,
  },
  overviewBar: { marginTop: Spacing['2'] },
  loader: { marginTop: Spacing['10'] },
  timelineWrapper: {},
});
