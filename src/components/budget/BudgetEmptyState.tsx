/**
 * @file BudgetEmptyState.tsx
 * @architecture Presentation Layer — UI Component
 * @description Empty state for the Budget screen using the standard hero anatomy:
 *   dashed outer ring + amber gradient icon circle + badge + 3 feature rows + hint strip.
 *   Matches the design gold standard established by the Ledger empty state.
 * @associatedFiles src/app/(tabs)/budget.tsx
 */

import React from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

const FEATURES: { icon: 'pie-chart-outline' | 'bar-chart-outline' | 'notifications-outline'; colorKey: 'warning' | 'savings' | 'expense'; text: string }[] = [
  { icon: 'pie-chart-outline',     colorKey: 'warning', text: 'Set spending limits per category'   },
  { icon: 'bar-chart-outline',     colorKey: 'savings', text: 'Visual progress bars for each limit' },
  { icon: 'notifications-outline', colorKey: 'expense', text: 'Alerts before you overspend'         },
];

export function BudgetEmptyState({ onSetBudget }: { onSetBudget?: () => void }) {
  const { colors } = useTheme();
  const accentHex = colors.status.warning;

  return (
    <View style={s.root}>
      {/* ── Hero ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140)} style={s.heroWrap}>
        <View style={[s.outerRing, { borderColor: accentHex + '28' }]} />
        <LinearGradient
          colors={[accentHex, accentHex] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.iconCircle, { shadowColor: colors.black }]}
        >
          <Ionicons name="wallet-outline" size={36} color={colors.white} />
        </LinearGradient>
        <View style={[s.badge, { backgroundColor: accentHex + '20' }]}>
          <Ionicons name="add" size={16} color={accentHex} />
        </View>
      </Animated.View>

      {/* ── Text ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={s.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">
          No budgets set
        </AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={s.subtitle}>
          Set monthly limits per category to stay on track and build better money habits.
        </AppText>
        
        {onSetBudget && (
          <Pressable
            onPress={onSetBudget}
            style={({ pressed }) => [
              s.addBtn,
              {
                backgroundColor: colors.brand.primary,
                opacity: pressed ? 0.8 : 1,
                marginTop: 8,
              },
            ]}
          >
            <Ionicons name="add-circle" size={15} color={colors.brand.onPrimary} />
            <AppText style={{ color: colors.brand.onPrimary, fontWeight: '700', fontSize: 12 }}>
              Set spending limits
            </AppText>
          </Pressable>
        )}
      </Animated.View>

      {/* ── Feature rows ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(160)} style={s.featuresCol}>
        {FEATURES.map(({ icon, colorKey, text }) => {
          const featureColor = colors.status[colorKey];
          return (
            <View key={text} style={[s.featureRow, { backgroundColor: colors.surface.sheet, borderColor: accentHex + '20', shadowColor: colors.black }]}>
              <View style={[s.featureIcon, { backgroundColor: featureColor + '15' }]}>
                <Ionicons name={icon} size={16} color={featureColor} />
              </View>
              <AppText variant="bodySM" color={colors.text.secondary} style={{ flex: 1 }}>{text}</AppText>
            </View>
          );
        })}
      </Animated.View>

      {/* ── Hint ─── */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(240)}
        style={[s.hint, { backgroundColor: accentHex + '0C', borderColor: accentHex + '25' }]}
      >
        <Ionicons name="bulb-outline" size={14} color={accentHex} />
        <AppText variant="caption" color={colors.text.secondary} style={{ flex: 1 }}>
          Tap{' '}
          <AppText variant="caption" style={{ color: accentHex, fontWeight: '700' }}>+ Payment</AppText>
          {' '}below to schedule your first payment
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
      ios:     { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
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
      ios:     { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  featureIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center',
    gap: Spacing['2'], padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
});
