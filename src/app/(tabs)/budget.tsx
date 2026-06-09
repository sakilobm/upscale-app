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
import { Colors, Spacing, Layout, Radius } from '@constants/index';
import type { Budget } from '@store/types';

const SCREEN_CONSTANTS = {
  title: 'Budget',
  overviewTitle: 'Monthly Overview',
} as const;

export default function BudgetScreen() {
  const { data: budgetsData, isLoading, isEmpty, refresh, summary } = useBudgets();
  const budgets = budgetsData ?? [];

  const handleBudgetPress = (_budget: Budget) => {
    // Future: expand to detail modal
  };

  const overviewGradient: [string, string] =
    summary && summary.percentUsed > 100
      ? [Colors.status.expense, Colors.status.expense]
      : [Colors.brand.primary, Colors.brand.accent];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="headingLG">{SCREEN_CONSTANTS.title}</AppText>
      </View>

      {/* Overview card */}
      {summary && (
        <View style={styles.overviewWrapper}>
          <GlassCard padding={Spacing['5']} borderRadius={Radius.xl} borderGlow>
            <AppText variant="labelMD" color={Colors.text.secondary}>
              {SCREEN_CONSTANTS.overviewTitle}
            </AppText>
            <View style={styles.overviewRow}>
              <View>
                <AppText variant="numericLG" color={Colors.text.primary}>
                  ${summary.totalSpent.toFixed(0)}
                </AppText>
                <AppText variant="caption" color={Colors.text.secondary}>
                  of ${summary.totalLimit.toFixed(0)} total
                </AppText>
              </View>
              <View style={styles.overviewRight}>
                <AppText
                  variant="headingMD"
                  color={
                    summary.percentUsed > 100
                      ? Colors.status.expense
                      : Colors.status.income
                  }
                >
                  {summary.percentUsed.toFixed(0)}%
                </AppText>
                {summary.overBudgetCount > 0 && (
                  <View style={styles.overBudgetBadge}>
                    <AppText variant="caption" color={Colors.status.expense}>
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
        <ActivityIndicator
          color={Colors.brand.primary}
          style={styles.loader}
        />
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
              tintColor={Colors.brand.secondary}
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
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
  overviewRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  overBudgetBadge: {
    backgroundColor: Colors.status.expense + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  overviewBar: {
    marginTop: Spacing['2'],
  },
  loader: {
    marginTop: Spacing['10'],
  },
  list: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['1'],
  },
  separator: {
    height: Spacing['3'],
  },
});
