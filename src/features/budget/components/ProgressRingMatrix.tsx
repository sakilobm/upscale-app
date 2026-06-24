import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ProgressRing } from '@components/ProgressRing';
import { AppText } from '@components/AppText';
import { GlassCard } from '@components/GlassCard';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Radius } from '@constants/Dimensions';
import type { Budget } from '@store/types';
import { getCategoryById } from '@store/categoryStore';

// ─── Single Ring Cell (Memoized for High Performance) ────────────────────────

interface RingCellProps {
  budget: Budget;
  onPress?: (b: Budget) => void;
}

const RingCell = memo(function RingCell({ budget, onPress }: RingCellProps) {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();
  const pct = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const isOver = pct > 1;
  const remaining = Math.max(budget.limit - budget.spent, 0);

  const catIcon = getCategoryById(budget.category).icon;

  const handlePress = useCallback(() => {
    onPress?.(budget);
  }, [budget, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.75 : 1 }]}
    >
      <ProgressRing
        progress={Math.min(pct, 1)}
        size={72}
        strokeWidth={6}
        color={budget.color}
        label={`${Math.round(pct * 100)}%`}
        icon={catIcon as any}
        animated
      />
      <AppText
        variant="labelSM"
        color={colors.text.primary}
        style={styles.cellName}
        numberOfLines={1}
      >
        {budget.category.charAt(0).toUpperCase() + budget.category.slice(1)}
      </AppText>
      <AppText
        variant="caption"
        style={[
          styles.cellSub,
          { color: isOver ? colors.status.expense : colors.text.tertiary },
        ]}
        numberOfLines={1}
      >
        {isOver
          ? `${symbol}${(budget.spent - budget.limit).toFixed(0)} over`
          : `${symbol}${remaining.toFixed(0)} left`}
      </AppText>
    </Pressable>
  );
});

// ─── Matrix grid ─────────────────────────────────────────────────────────────

interface ProgressRingMatrixProps {
  budgets: Budget[];
  onPress?: (b: Budget) => void;
}

export function ProgressRingMatrix({ budgets, onPress }: ProgressRingMatrixProps) {
  const { colors } = useTheme();

  if (!budgets.length) return null;

  return (
    <GlassCard padding={Spacing['4']} borderRadius={Radius.xl}>
      <AppText variant="headingSM" color={colors.text.primary} style={styles.title}>
        Budget Overview
      </AppText>

      <View style={styles.grid}>
        {budgets.map((b) => (
          <RingCell key={b.id} budget={b} onPress={onPress} />
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: Spacing['4'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing['4'],
    columnGap: 0,
  },
  cell: {
    alignItems: 'center',
    width: '33.333%',
    paddingVertical: Spacing['2'],
    gap: 4,
  },
  cellName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellSub: {
    fontSize: 10,
    textAlign: 'center',
  },
});
