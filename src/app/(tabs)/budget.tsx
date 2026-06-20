/**
 * @file budget.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Budget screen. Pure declarative orchestrator: reads a single contract
 *   from useBudgetScreen and renders extracted components. Zero business logic,
 *   zero raw useState, zero store imports.
 * @associatedFiles src/features/budget/hooks/useBudgetScreen.ts,
 *   src/components/budget/ (AddPaymentSheet, BudgetEmptyState, AnimatedIcon, AddBudgetLimitSheet)
 */

import {
  View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeInDown,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetScreen } from '@features/budget/hooks/useBudgetScreen';
import { AddPaymentSheet } from '@components/budget/AddPaymentSheet';
import { AddBudgetLimitSheet } from '@components/budget/AddBudgetLimitSheet';
import { PayPartialSheet } from '@components/budget/PayPartialSheet';
import { BudgetEmptyState } from '@components/budget/BudgetEmptyState';
import { AnimatedIcon } from '@components/budget/AnimatedIcon';
import { BudgetCategoryList } from '@features/budget/components/BudgetCategoryList';
import { PlannedPaymentsTimeline } from '@features/budget/components/PlannedPaymentsTimeline';
import { AppHeader } from '@components/AppHeader';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { FAB } from '@components/FAB';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Layout, Radius } from '@constants/index';
import type { PlannedPayment } from '@store/plannedPaymentsStore';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid-outline', color: '#8B5CF6' },
  { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#3B82F6' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline', color: '#10B981' },
  { id: 'transport', label: 'Transport', icon: 'car-outline', color: '#38BDF8' },
  { id: 'health', label: 'Health', icon: 'fitness-outline', color: '#EF4444' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#8B5CF6' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#F59E0B' },
  { id: 'savings', label: 'Savings', icon: 'wallet-outline', color: '#10B981' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();
  
  const {
    budgets, isLoading, refresh, summary,
    payments, settlePayment, deletePayment, addPayment, payPartial, deleteBudget,
    addSheet,
  } = useBudgetScreen();

  const [activePartialPayment, setActivePartialPayment] = useState<PlannedPayment | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addBudgetVisible, setAddBudgetVisible] = useState(false);

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
    } else {
      progressShared.value = withSpring(0, { damping: 18, stiffness: 120 });
    }
  }, [summary?.percentUsed]);

  const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressShared.value * 100}%` }));
  const remaining = summary ? summary.totalLimit - summary.totalSpent : 0;

  // Filter lists based on horizontal category tabs selection
  const filteredBudgets = selectedCategory === 'all'
    ? budgets
    : budgets.filter((b) => b.category === selectedCategory);

  const filteredPayments = selectedCategory === 'all'
    ? payments
    : payments.filter((p) => p.category === selectedCategory);

  // If BOTH are completely empty (no limits set globally AND no scheduled/planned payments at all)
  const isScreenEmpty = budgets.length === 0 && payments.length === 0;

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand.primary} />}
      >
        <AppHeader title="Budget" subtitle="Monthly spending limits" noPadding />

        {/* 1. Overview Card (Only when budgets exist) */}
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

        {/* 2. Main content states */}
        {isLoading && !budgets.length && !payments.length ? (
          <ActivityIndicator color={colors.brand.primary} style={s.loader} />
        ) : isScreenEmpty ? (
          <BudgetEmptyState onSetBudget={() => setAddBudgetVisible(true)} />
        ) : (
          <View style={{ gap: Spacing['4'] }}>
            {/* Category Filter Scroll View */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.categoryFilterBar}
              >
                {FILTER_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  const activeBg = cat.color + '18';
                  const activeBorder = cat.color + '4D';
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={[
                        s.categoryTab,
                        {
                          backgroundColor: active ? activeBg : colors.glass.background,
                          borderColor: active ? activeBorder : colors.glass.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={active ? cat.color : colors.text.secondary}
                      />
                      <AppText
                        style={[
                          s.categoryTabText,
                          { color: active ? cat.color : colors.text.secondary }
                        ]}
                      >
                        {cat.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Category Budgets Visual List */}
            {budgets.length === 0 ? (
              <GlassCard padding={Spacing['4']} borderRadius={Radius.xl} style={s.compactCTA}>
                <View style={s.compactCTALeft}>
                  <View style={[s.iconCircle, { backgroundColor: colors.status.warning + '18' }]}>
                    <Ionicons name="pie-chart-outline" size={20} color={colors.status.warning} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <AppText variant="labelMD" color={colors.text.primary}>Set Spending Limits</AppText>
                    <AppText variant="caption" color={colors.text.secondary} style={{ fontSize: 10 }}>Establish monthly budgets to track your limits.</AppText>
                  </View>
                </View>
                <Pressable
                  onPress={() => setAddBudgetVisible(true)}
                  style={({ pressed }) => [s.compactCTAButton, { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="add" size={14} color={colors.brand.onPrimary} />
                  <AppText style={{ color: colors.brand.onPrimary, fontSize: 11, fontWeight: '700' }}>Set Budget</AppText>
                </Pressable>
              </GlassCard>
            ) : filteredBudgets.length === 0 ? (
              <GlassCard padding={Spacing['4']} borderRadius={Radius.xl} style={s.compactCTA}>
                <View style={s.compactCTALeft}>
                  <View style={[s.iconCircle, { backgroundColor: colors.text.tertiary + '15' }]}>
                    <Ionicons name="wallet-outline" size={20} color={colors.text.tertiary} />
                  </View>
                  <View style={{ flex: 1, gap: 1 }}>
                    <AppText variant="labelMD" color={colors.text.primary}>
                      No limit for {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                    </AppText>
                    <AppText variant="caption" color={colors.text.secondary} style={{ fontSize: 10 }}>Set a spending budget to monitor progress.</AppText>
                  </View>
                </View>
                <Pressable
                  onPress={() => setAddBudgetVisible(true)}
                  style={({ pressed }) => [s.compactCTAButton, { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="add" size={14} color={colors.brand.onPrimary} />
                  <AppText style={{ color: colors.brand.onPrimary, fontSize: 11, fontWeight: '700' }}>Set Limit</AppText>
                </Pressable>
              </GlassCard>
            ) : (
              <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(100)}>
                <BudgetCategoryList budgets={filteredBudgets} onDeleteBudget={deleteBudget} />
              </Animated.View>
            )}

            {/* Planned Payments Timeline */}
            <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(200)}>
              <PlannedPaymentsTimeline
                payments={filteredPayments}
                onSettle={settlePayment}
                onDelete={deletePayment}
                onPress={setActivePartialPayment}
              />
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Sheets & Dialogs */}
      <AddPaymentSheet
        visible={addSheet.isVisible}
        onClose={addSheet.close}
        onSubmit={({ title, amount, dueDate, category, accountId }) =>
          addPayment({ title, amount, dueDate, category, accountId, isRecurring: false })
        }
      />

      <AddBudgetLimitSheet
        visible={addBudgetVisible}
        onClose={() => setAddBudgetVisible(false)}
      />

      <PayPartialSheet
        visible={!!activePartialPayment}
        payment={activePartialPayment}
        onClose={() => setActivePartialPayment(null)}
        onSubmit={(amount, accountId, note) => {
          if (activePartialPayment) {
            payPartial(activePartialPayment.id, amount, accountId, note);
          }
        }}
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

  categoryFilterBar: {
    paddingVertical: Spacing['1'],
    gap: Spacing['2'],
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginRight: 2,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  compactCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing['4'],
    borderRadius: Radius.xl,
    gap: Spacing['3'],
  },
  compactCTALeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCTAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
  },
});
