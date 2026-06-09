import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ProgressRing } from '@components/ProgressRing';
import { AppText } from '@components/AppText';
import { GlassCard } from '@components/GlassCard';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/Dimensions';
import type { Budget } from '@store/types';

// ─── Category icon map ────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  housing:       '🏠',
  food:          '🍔',
  transport:     '🚗',
  health:        '🏥',
  entertainment: '🎬',
  shopping:      '🛍',
  education:     '📚',
  savings:       '💰',
  investment:    '📈',
  salary:        '💼',
  freelance:     '💻',
  gift:          '🎁',
  other:         '📦',
};

// ─── Single Ring Cell ─────────────────────────────────────────────────────────

interface RingCellProps {
  budget:  Budget;
  onPress: (b: Budget) => void;
}

function RingCell({ budget, onPress }: RingCellProps) {
  const { colors, isDark } = useTheme();
  const pct       = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const isOver    = pct > 1;
  const remaining = Math.max(budget.limit - budget.spent, 0);

  const ringColor = budget.color;

  return (
    <Pressable
      onPress={() => onPress(budget)}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.75 : 1 }]}
    >
      <ProgressRing
        progress={Math.min(pct, 1)}
        size={72}
        strokeWidth={6}
        color={budget.color}
        label={`${Math.round(pct * 100)}%`}
        sublabel={CATEGORY_EMOJI[budget.category] ?? ''}
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
          ? `$${(budget.spent - budget.limit).toFixed(0)} over`
          : `$${remaining.toFixed(0)} left`}
      </AppText>
    </Pressable>
  );
}

// ─── Matrix grid ─────────────────────────────────────────────────────────────

interface ProgressRingMatrixProps {
  budgets:  Budget[];
  onPress?: (b: Budget) => void;
}

export function ProgressRingMatrix({ budgets, onPress }: ProgressRingMatrixProps) {
  const { colors } = useTheme();

  if (!budgets.length) return null;

  const handlePress = (b: Budget) => onPress?.(b);

  return (
    <GlassCard padding={Spacing['4']} borderRadius={Radius.xl}>
      <AppText variant="headingSM" color={colors.text.primary} style={styles.title}>
        Budget Overview
      </AppText>

      <View style={styles.grid}>
        {budgets.map((b) => (
          <RingCell key={b.id} budget={b} onPress={handlePress} />
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
    flexWrap:      'wrap',
    gap:           Spacing['2'],
  },
  cell: {
    alignItems:     'center',
    width:          '30%',
    paddingVertical: Spacing['2'],
    gap:            4,
  },
  cellName: {
    fontSize:    12,
    fontWeight:  '600',
    textAlign:   'center',
  },
  cellSub: {
    fontSize: 10,
    textAlign: 'center',
  },
});
