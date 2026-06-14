/**
 * @file ActivityEmptyState.tsx
 * @architecture Presentation Layer — UI Component
 * @description Empty state for the Activity screen using the standard hero anatomy:
 *   dashed outer ring + brand-gradient icon circle + badge + 3 feature rows + hint strip.
 * @associatedFiles src/app/(tabs)/transactions.tsx
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

const FEATURES = [
  { icon: 'trending-down-outline' as const, color: '#EF4444', text: 'Log expenses by category' },
  { icon: 'trending-up-outline'   as const, color: '#10B981', text: 'Record income sources'    },
  { icon: 'analytics-outline'     as const, color: '#6366F1', text: 'See monthly breakdowns'   },
] as const;

export function ActivityEmptyState() {
  const { colors, isDark } = useTheme();
  const cardBg    = isDark ? colors.background.secondary : '#FFFFFF';
  const accentHex = colors.brand.primary;

  return (
    <View style={s.root}>
      {/* ── Hero ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140)} style={s.heroWrap}>
        <View style={[s.outerRing, { borderColor: accentHex + '28' }]} />
        <LinearGradient
          colors={[accentHex, colors.brand.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.iconCircle}
        >
          <Ionicons name="receipt-outline" size={36} color="#fff" />
        </LinearGradient>
        <View style={[s.badge, { backgroundColor: '#10B98120' }]}>
          <Ionicons name="add" size={16} color="#10B981" />
        </View>
      </Animated.View>

      {/* ── Text ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={s.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">No transactions yet</AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={s.subtitle}>
          Start logging your income and expenses to get a clear picture of your finances.
        </AppText>
      </Animated.View>

      {/* ── Feature rows ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(160)} style={s.featuresCol}>
        {FEATURES.map(({ icon, color, text }) => (
          <View key={text} style={[s.featureRow, { backgroundColor: cardBg, borderColor: accentHex + '20' }]}>
            <View style={[s.featureIcon, { backgroundColor: color + '15' }]}>
              <Ionicons name={icon} size={16} color={color} />
            </View>
            <AppText variant="bodySM" color={colors.text.secondary} style={{ flex: 1 }}>{text}</AppText>
          </View>
        ))}
      </Animated.View>

      {/* ── Hint ─── */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(240)}
        style={[s.hint, { backgroundColor: accentHex + '0C', borderColor: accentHex + '25' }]}
      >
        <Ionicons name="home-outline" size={14} color={accentHex} />
        <AppText variant="caption" color={colors.text.secondary} style={{ flex: 1 }}>
          Go to{' '}
          <AppText variant="caption" style={{ color: accentHex, fontWeight: '700' }}>Home</AppText>
          {' '}and tap{' '}
          <AppText variant="caption" style={{ color: colors.status.expense, fontWeight: '700' }}>Expense</AppText>
          {' '}or{' '}
          <AppText variant="caption" style={{ color: colors.status.income, fontWeight: '700' }}>Income</AppText>
          {' '}to get started
        </AppText>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { alignItems: 'center', paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], gap: Spacing['4'] },
  heroWrap:    { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  outerRing:   { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1.5, borderStyle: 'dashed' },
  iconCircle: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 12 },
    }),
  },
  badge:       { position: 'absolute', bottom: 14, right: 10, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  textBlock:   { alignItems: 'center', gap: Spacing['2'] },
  subtitle:    { maxWidth: 280, lineHeight: 20 },
  featuresCol: { alignSelf: 'stretch', gap: Spacing['2'] },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['3'],
    padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing['2'], padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
  },
});
