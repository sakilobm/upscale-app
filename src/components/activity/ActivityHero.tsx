/**
 * @file ActivityHero.tsx
 * @architecture Presentation Layer — UI Component
 * @description Month summary strip at the top of the Activity screen. Shows income,
 *   expense and net stats in a 3-column card with a gradient accent line.
 * @associatedFiles src/features/transactions/hooks/useActivityScreen.ts,
 *   src/app/(tabs)/transactions.tsx
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Radius } from '@constants/index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SummaryData { income: number; expense: number; count: number }

interface Props {
  summary: SummaryData;
  monthLabel: string;
}

export function ActivityHero({ summary, monthLabel }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const net = summary.income - summary.expense;

  const isBrightColor = !isDark && colors.brand.primary === '#C4F135';
  const chipBgColor = colors.brand.primary;
  const chipTextColor = isBrightColor ? '#2E5403' : colors.brand.primary;

  const cardBg = colors.surface.sheet;
  const cardBorder = colors.glass.background;

  const stats: { label: string; value: number; color: string; icon: IoniconName; sign?: string }[] = [
    { label: 'Income', value: summary.income, color: colors.status.income, icon: 'arrow-down-circle-outline', sign: '+' },
    { label: 'Expenses', value: summary.expense, color: colors.status.expense, icon: 'arrow-up-circle-outline', sign: '-' },
    { label: 'Net', value: Math.abs(net), color: net >= 0 ? colors.status.income : colors.status.expense, icon: net >= 0 ? 'trending-up-outline' : 'trending-down-outline', sign: net >= 0 ? '+' : '-' },
  ];

  return (
    <Animated.View entering={FadeInDown.springify().damping(18).stiffness(130)}>
      <View style={s.titleRow}>
        <View style={s.titleLeft}>
          <AppText variant="headingLG" color={colors.text.primary} style={s.title}>Activity</AppText>
          <View style={[s.monthChip, { backgroundColor: chipBgColor + '95', borderColor: chipBgColor + '65' }]}>
            <Ionicons name="calendar-outline" size={12} color={chipTextColor} />
            <AppText variant="labelSM" style={{ color: chipTextColor, fontWeight: '600', fontSize: 11 }}>
              {monthLabel}
            </AppText>
          </View>
        </View>
        <AppText variant="caption" color={colors.text.tertiary} style={s.count}>
          {summary.count} transactions
        </AppText>
      </View>

      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: colors.black }]}>
        {stats.map((stat, idx) => (
          <View key={stat.label} style={[s.cell, idx < 2 && { borderRightWidth: 1, borderRightColor: cardBorder }]}>
            <View style={[s.iconWrap, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon} size={15} color={stat.color} />
            </View>
            <AppText variant="caption" color={colors.text.tertiary} style={s.statLabel}>{stat.label}</AppText>
            <AppText variant="labelLG" style={[s.statValue, { color: stat.color }]} numberOfLines={1} adjustsFontSizeToFit>
              {stat.sign}{symbol}{stat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </AppText>
          </View>
        ))}
        <LinearGradient
          colors={[colors.status.income, colors.brand.primary, colors.status.expense]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.accentLine}
        />
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], marginBottom: Spacing['1'],
  },
  titleLeft: { gap: Spacing['2'] },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 },
  monthChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  count: { fontSize: 12, paddingBottom: 4 },
  card: {
    flexDirection: 'row', marginHorizontal: Spacing['5'],
    borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', position: 'relative',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: Spacing['4'], gap: Spacing['1'] },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statLabel: { fontSize: 10, letterSpacing: 0.4, fontWeight: '500' },
  statValue: { fontSize: 13, fontWeight: '700' },
  accentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 2.5 },
});
