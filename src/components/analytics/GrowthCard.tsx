/**
 * @file GrowthCard.tsx
 * @architecture Presentation Layer — UI Component
 * @description Card showing growth metric current value, change percentage, and direction.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import type { GrowthMetric } from '@features/analytics/hooks/useAnalyticsScreen';
import { Radius, Spacing } from '@constants/index';

interface Props {
  /** Growth metric object containing label, values, and growth percentage */
  metric: GrowthMetric;
  /** Translucent card background color */
  cardBg: string;
  /** Resolved theme colors object */
  colors: any;
  /** Currency abbreviation formatter function */
  formatAmount: (n: number) => string;
}

export function GrowthCard({ metric, cardBg, colors, formatAmount }: Props) {
  const accentColor =
    metric.label === 'Income'   ? '#10B981' :
    metric.label === 'Expenses' ? '#EF4444' : '#6C63FF';

  const isExpense = metric.label === 'Expenses';
  const isUp = metric.direction === 'up';
  const isDown = metric.direction === 'down';

  const badgeColor = isExpense
    ? (isUp ? '#EF4444' : '#10B981')
    : (isUp ? '#10B981' : '#EF4444');

  return (
    <View style={[s.growthCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
      <View style={[s.growthAccent, { backgroundColor: accentColor }]} />
      <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>
        {metric.label}
      </AppText>
      <AppText style={{ fontSize: 17, fontWeight: '800', color: colors.text.primary }}>
        {formatAmount(metric.current)}
      </AppText>
      <View style={s.growthBadgeRow}>
        <Ionicons
          name={isUp ? 'caret-up' : isDown ? 'caret-down' : 'remove'}
          size={10}
          color={badgeColor}
        />
        <AppText
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: badgeColor,
          }}
        >
          {Math.abs(metric.changePct).toFixed(0)}%
        </AppText>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  growthCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing['3'],
    gap: 3,
  },
  growthAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  growthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
});
