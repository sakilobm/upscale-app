/**
 * @file budget.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Budget screen. Pure declarative orchestrator: reads a single contract
 *   from useBudgetScreen and renders extracted components. Zero business logic,
 *   zero raw useState, zero store imports.
 * @associatedFiles src/features/budget/hooks/useBudgetScreen.ts,
 *   src/components/budget/ (AddPaymentSheet, BudgetEmptyState, AnimatedIcon)
 */

import {
  View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetScreen } from '@features/budget/hooks/useBudgetScreen';
import { AddPaymentSheet } from '@components/budget/AddPaymentSheet';
import { BudgetEmptyState } from '@components/budget/BudgetEmptyState';
import { AnimatedIcon } from '@components/budget/AnimatedIcon';
import { ProgressRingMatrix } from '@features/budget/components/ProgressRingMatrix';
import { PlannedPaymentsTimeline } from '@features/budget/components/PlannedPaymentsTimeline';
import { AppHeader } from '@components/AppHeader';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { FAB } from '@components/FAB';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Layout, Radius } from '@constants/index';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();
  const {
    budgets, isLoading, isEmpty, refresh, summary,
    payments, settlePayment, deletePayment, addPayment,
    addSheet,
  } = useBudgetScreen();

  const percent   = summary ? summary.percentUsed : 0;
  const isOver    = percent > 100;
  const isWarning = percent >= 85 && percent <= 100;

  let iconName: any = 'wallet-outline';
  let iconColor = colors.brand.primary;
  let badgeBg   = colors.brand.primary + '18';
  if (isOver)         { iconName = 'alert-circle'; iconColor = colors.status.expense; badgeBg = colors.status.expense + '20'; }
  else if (isWarning) { iconName = 'trending-up';  iconColor = colors.status.warning;            badgeBg = colors.status.warning + '20'; }

  const dynamicBorderColor = isOver
    ? colors.status.expense + '50'
    : isWarning ? colors.status.warning + '60' : colors.brand.primary + '30';

  const overviewGradient: [string, string] = isOver
    ? [colors.status.expense, colors.status.expense]
    : isWarning ? [colors.status.warning, colors.status.warning] : [colors.brand.primary, colors.brand.accent];

  const progressShared = useSharedValue(0);
  useEffect(() => {
    if (summary) {
      progressShared.value = withSpring(Math.min(summary.percentUsed / 100, 1), { damping: 18, stiffness: 120 });
    }
  }, [summary?.percentUsed]);

  const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressShared.value * 100}%` }));
  const remaining = summary ? summary.totalLimit - summary.totalSpent : 0;

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand.primary} />}
      >
        <AppHeader title="Budget" subtitle="Monthly spending limits" noPadding />

        {summary && (
          <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120)}>
            <GlassCard
              padding={Spacing['5']} borderRadius={Radius.xl}
              borderGlow={isOver || isWarning}
              style={[s.overviewCard, { borderColor: dynamicBorderColor }]}
            >
              <View style={s.cardHeader}>
                <View style={s.cardHeaderLeft}>
                  <AnimatedIcon iconName={iconName} iconColor={iconColor} badgeBg={badgeBg} isOver={isOver} />
                  <View>
                    <AppText variant="labelMD" color={colors.text.secondary}>Monthly Overview</AppText>
                    <AppText variant="caption" color={colors.text.tertiary}>Tracking period: Current Month</AppText>
                  </View>
                </View>
                <AppText
                  variant="headingMD"
                  color={isOver ? colors.status.expense : isWarning ? colors.status.warning : colors.status.income}
                >
                  {summary.percentUsed.toFixed(0)}%
                </AppText>
              </View>

              <View style={s.metricsRow}>
                <View>
                  <AppText variant="numericLG" color={colors.text.primary}>{symbol}{summary.totalSpent.toFixed(0)}</AppText>
                  <AppText variant="caption" color={colors.text.secondary}>spent of {symbol}{summary.totalLimit.toFixed(0)}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="numeric" color={isOver ? colors.status.expense : colors.status.income}>
                    {isOver ? '-' : ''}{symbol}{Math.abs(remaining).toFixed(0)}
                  </AppText>
                  <AppText variant="caption" color={colors.text.secondary}>{isOver ? 'over budget' : 'remaining'}</AppText>
                </View>
              </View>

              <View style={[s.progressContainer, { backgroundColor: colors.glass.backgroundMid }]}>
                <Animated.View style={[s.progressBarFill, animatedProgressStyle]}>
                  <LinearGradient colors={overviewGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                </Animated.View>
              </View>

              {summary.overBudgetCount > 0 && (
                <View style={s.cardFooter}>
                  <Ionicons name="warning" size={14} color={colors.status.expense} />
                  <AppText variant="caption" style={{ color: colors.status.expense, fontWeight: '600' }}>
                    {summary.overBudgetCount} category budget{summary.overBudgetCount > 1 ? 's' : ''} exceeded
                  </AppText>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {isLoading && !budgets.length ? (
          <ActivityIndicator color={colors.brand.primary} style={s.loader} />
        ) : isEmpty ? (
          <BudgetEmptyState />
        ) : (
          <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(100)}>
            <ProgressRingMatrix budgets={budgets} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(200)}>
          <PlannedPaymentsTimeline payments={payments} onSettle={settlePayment} onDelete={deletePayment} />
        </Animated.View>
      </ScrollView>

      <AddPaymentSheet
        visible={addSheet.isVisible}
        onClose={addSheet.close}
        onSubmit={({ title, amount, dueDate, category }) =>
          addPayment({ title, amount, dueDate, category, isRecurring: false })
        }
      />

      <FAB icon="add" label="Payment" onPress={addSheet.open} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll:   { paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'], gap: Spacing['4'] },
  overviewCard: {},
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing['4'] },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  metricsRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing['4'] },
  progressContainer: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },
  progressBarFill:   { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing['4'] },
  loader: { marginTop: Spacing['10'] },
});
