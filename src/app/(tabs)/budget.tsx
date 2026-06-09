import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBudgets } from '@features/budget/hooks/useBudgets';
import { BudgetCard } from '@features/budget/components/BudgetCard';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { EmptyState } from '@components/EmptyState';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { Budget } from '@store/types';

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { data: budgetsData, isLoading, isEmpty, refresh, summary } = useBudgets();
  const budgets = budgetsData ?? [];

  const handleBudgetPress = (_budget: Budget) => {};

  const overviewGradient: [string, string] =
    summary && summary.percentUsed > 100
      ? [colors.status.expense, colors.status.expense]
      : [colors.brand.primary, colors.brand.accent];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="headingLG" color={colors.text.primary}>Budget</AppText>
      </View>

      {summary && (
        <View style={styles.overviewWrapper}>
          <GlassCard padding={Spacing['5']} borderRadius={Radius.xl} borderGlow>
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
        </View>
      )}

      {isLoading && !budgets.length ? (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      ) : isEmpty ? (
        <EmptyState
          emoji="🎯"
          title="No budgets set"
          subtitle="Set spending limits to track your habits."
        />
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={(b) => b.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
          ]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.brand.primary}
            />
          }
          renderItem={({ item }) => (
            <BudgetCard budget={item} onPress={handleBudgetPress} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    paddingBottom: Spacing['3'],
  },
  overviewWrapper: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['4'],
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginVertical: Spacing['3'],
  },
  overviewRight: { alignItems: 'flex-end', gap: 4 },
  overBudgetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  overviewBar: { marginTop: Spacing['2'] },
  loader: { marginTop: Spacing['10'] },
  list: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['1'],
  },
  separator: { height: Spacing['3'] },
});
