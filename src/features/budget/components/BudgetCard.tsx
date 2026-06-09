import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { CategoryIcon } from '@components/CategoryIcon';
import { Colors, Radius, Spacing } from '@constants/index';
import type { BudgetCardProps } from '../types';

export const BudgetCard = memo(function BudgetCard({
  budget,
  onPress,
}: BudgetCardProps) {
  const progress = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const isOver = budget.spent > budget.limit;
  const remaining = budget.limit - budget.spent;
  const progressGradient: [string, string] = isOver
    ? [Colors.status.expense, Colors.status.expense]
    : [budget.color, budget.color + 'AA'];

  return (
    <GlassCard
      onPress={() => onPress(budget)}
      padding={Spacing['4']}
      borderRadius={Radius.xl}
      borderGlow={isOver}
    >
      <View style={styles.row}>
        <CategoryIcon category={budget.category} size={40} />
        <View style={styles.titleArea}>
          <AppText variant="labelLG" color={Colors.text.primary}>
            {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
          </AppText>
        </View>
        <View style={styles.amountArea}>
          <AppText
            variant="labelLG"
            color={isOver ? Colors.status.expense : Colors.text.primary}
          >
            ${budget.spent.toFixed(0)}
          </AppText>
          <AppText variant="caption" color={Colors.text.secondary}>
            of ${budget.limit.toFixed(0)}
          </AppText>
        </View>
      </View>

      <ProgressBar
        progress={Math.min(progress, 1)}
        gradient={progressGradient}
        height={6}
        style={styles.bar}
      />

      <View style={styles.footer}>
        <AppText
          variant="caption"
          color={isOver ? Colors.status.expense : Colors.text.tertiary}
        >
          {isOver
            ? `$${Math.abs(remaining).toFixed(2)} over budget`
            : `$${remaining.toFixed(2)} remaining`}
        </AppText>
        <AppText variant="caption" color={Colors.text.tertiary}>
          {(progress * 100).toFixed(0)}%
        </AppText>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    marginBottom: Spacing['3'],
  },
  titleArea: {
    flex: 1,
    gap: 2,
  },
  amountArea: {
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    marginBottom: Spacing['2'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
