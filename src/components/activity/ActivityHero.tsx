/**
 * @file ActivityHero.tsx
 * @architecture Presentation Layer — UI Component
 * @description Premium unified summary card for the Activity screen. Replaces the
 *   three separate stat boxes with a single glassmorphic card featuring clean
 *   horizontal stat layout, gradient accent, and refined typography.
 * @associatedFiles src/features/transactions/hooks/useActivityScreen.ts,
 *   src/app/(tabs)/transactions.tsx
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
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
  const chipTextColor = isBrightColor ? '#2E5403' : colors.brand.primary;

  const incomeColor  = colors.status.income;
  const expenseColor = colors.status.expense;
  const netColor     = net >= 0 ? incomeColor : expenseColor;
  const netIcon: IoniconName = net >= 0 ? 'trending-up' : 'trending-down';

  // Card background — dark: deep glass surface, light: clean white with subtle border
  const cardBg     = isDark ? colors.background.secondary : colors.background.card;
  const cardBorder = isDark ? colors.glass.borderStrong : colors.glass.borderStrong;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18).stiffness(130)}>

      {/* ── Title Row ── */}
      <View style={s.titleRow}>
        <View style={s.titleLeft}>
          <AppText style={[s.screenLabel, { color: colors.text.tertiary }]}>Monthly Overview</AppText>
          <AppText style={[s.title, { color: colors.text.primary }]}>Activity</AppText>
        </View>
        <View style={s.titleRight}>
          <View style={[s.monthChip, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '30' }]}>
            <Ionicons name="calendar-outline" size={12} color={chipTextColor} />
            <AppText style={{ color: chipTextColor, fontWeight: '700', fontSize: 11.5 }}>
              {monthLabel}
            </AppText>
          </View>
          <AppText style={[s.count, { color: colors.text.tertiary }]}>
            {summary.count} {summary.count === 1 ? 'transaction' : 'transactions'}
          </AppText>
        </View>
      </View>

      {/* ── Accent Line ── */}
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.accentLine}
      />

      {/* ── Unified Summary Card ── */}
      <Animated.View
        entering={FadeIn.delay(100).duration(400)}
        style={[
          s.card,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            shadowColor: isDark ? '#000' : colors.black,
          },
        ]}
      >
        {/* Top gradient accent */}
        <LinearGradient
          colors={isDark
            ? [colors.brand.primary + '30', colors.brand.accent + '15', 'transparent']
            : [colors.brand.primary + '22', colors.brand.accent + '0A', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cardGlow}
        />

        {/* Three Stats Row */}
        <View style={s.statsRow}>

          {/* Income */}
          <View style={s.statItem}>
            <View style={s.statLabelRow}>
              <View style={[s.statDot, { backgroundColor: incomeColor }]} />
              <AppText style={[s.statLabel, { color: colors.text.tertiary }]}>Income</AppText>
            </View>
            <AppText
              style={[s.statValue, { color: incomeColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              +{symbol}{summary.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </AppText>
          </View>

          {/* Vertical Divider */}
          <View style={[s.divider, { backgroundColor: colors.glass.borderStrong }]} />

          {/* Expenses */}
          <View style={s.statItem}>
            <View style={s.statLabelRow}>
              <View style={[s.statDot, { backgroundColor: expenseColor }]} />
              <AppText style={[s.statLabel, { color: colors.text.tertiary }]}>Expenses</AppText>
            </View>
            <AppText
              style={[s.statValue, { color: expenseColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              -{symbol}{summary.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </AppText>
          </View>

          {/* Vertical Divider */}
          <View style={[s.divider, { backgroundColor: colors.glass.borderStrong }]} />

          {/* Net */}
          <View style={s.statItem}>
            <View style={s.statLabelRow}>
              <Ionicons name={netIcon} size={11} color={netColor} style={{ marginRight: 2 }} />
              <AppText style={[s.statLabel, { color: colors.text.tertiary }]}>Net</AppText>
            </View>
            <AppText
              style={[s.statValue, { color: netColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {net >= 0 ? '+' : '-'}{symbol}{Math.abs(net).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </AppText>
          </View>

        </View>

        {/* Bottom accent strip — thin gradient line */}
        <LinearGradient
          colors={[incomeColor, expenseColor] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.bottomStrip}
        />
      </Animated.View>

    </Animated.View>
  );
}

const s = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'], paddingTop: Spacing['5'], marginBottom: Spacing['5'],
  },
  titleLeft:  { gap: 2 },
  titleRight: { alignItems: 'flex-end', gap: Spacing['1'], paddingTop: 3 },

  screenLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' },
  title:       { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, lineHeight: 36 },

  monthChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  count: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  /* ── Accent line ── */
  accentLine: {
    height: 3,
    marginHorizontal: Spacing['5'],
    borderRadius: 2,
    marginBottom: Spacing['5'],
  },

  /* ── Unified Card ── */
  card: {
    marginHorizontal: Spacing['5'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 4 },
    }),
  },
  cardGlow: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: 80,
  },

  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['5'],
    paddingHorizontal: Spacing['4'],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    height: 36,
    opacity: 0.6,
  },

  /* Bottom gradient strip */
  bottomStrip: {
    height: 2.5,
  },
});
