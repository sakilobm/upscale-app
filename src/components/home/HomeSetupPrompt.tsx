/**
 * @file HomeSetupPrompt.tsx
 * @architecture Presentation Layer — UI Component
 * @description Onboarding empty-state shown when the app has no accounts or transactions.
 *   Renders the standard hero anatomy (dashed ring + gradient circle + badge) plus
 *   three tappable setup-step rows and a privacy hint strip.
 * @associatedFiles src/app/(tabs)/index.tsx, src/features/dashboard/hooks/useHomeScreen.ts
 */

import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

interface Props {
  onLogExpense: () => void;
}

const SETUP_STEPS: { icon: 'wallet-outline' | 'receipt-outline' | 'bar-chart-outline'; colorKey: 'savings' | 'income' | 'warning'; title: string; subtitle: string; action: 'accounts' | 'transaction' | 'budget' }[] = [
  { icon: 'wallet-outline', colorKey: 'savings', title: 'Add your first account', subtitle: 'Link a bank, cash wallet, or savings account', action: 'accounts' },
  { icon: 'receipt-outline', colorKey: 'income', title: 'Log an expense or income', subtitle: 'Track where your money comes and goes', action: 'transaction' },
  { icon: 'bar-chart-outline', colorKey: 'warning', title: 'Set a monthly budget', subtitle: 'Limit spending per category and hit your goals', action: 'budget' },
];

export function HomeSetupPrompt({ onLogExpense }: Props) {
  const { colors } = useTheme();
  const accentHex = colors.brand.primary;

  const handleStep = (action: 'accounts' | 'transaction' | 'budget') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action === 'accounts') router.push('/accounts');
    else if (action === 'budget') router.push('/(tabs)/budget');
    else onLogExpense();
  };

  return (
    <View style={s.root}>
      {/* ── Hero ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140)} style={s.heroWrap}>
        <View style={[s.outerRing, { borderColor: accentHex + '28' }]} />
        <LinearGradient
          colors={[accentHex, colors.brand.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.iconCircle, { shadowColor: colors.black }]}
        >
          <Ionicons name="rocket-outline" size={36} color={colors.white} />
        </LinearGradient>
        <View style={[s.badge, { backgroundColor: accentHex + '20' }]}>
          <Ionicons name="sparkles" size={13} color={accentHex} />
        </View>
      </Animated.View>

      {/* ── Text ─── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={s.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">
          Welcome to WhereCash
        </AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={s.subtitle}>
          3 quick steps to start tracking your money and hitting your goals.
        </AppText>
      </Animated.View>

      {/* ── Steps ─── */}
      <View style={s.stepsCol}>
        {SETUP_STEPS.map((step, i) => {
          const stepColor = colors.status[step.colorKey];
          return (
            <Animated.View
              key={step.title}
              entering={FadeInDown.springify().damping(20).stiffness(140).delay(160 + i * 70)}
            >
              <Pressable
                onPress={() => handleStep(step.action)}
                style={({ pressed }) => [
                  s.stepRow,
                  { backgroundColor: colors.surface.sheet, borderColor: stepColor + '22', shadowColor: colors.black, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <View style={[s.stepIcon, { backgroundColor: stepColor + '15' }]}>
                  <Ionicons name={step.icon} size={16} color={stepColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="labelMD" color={colors.text.primary}>{step.title}</AppText>
                  <AppText variant="caption" color={colors.text.secondary} style={{ lineHeight: 17, marginTop: 1 }}>
                    {step.subtitle}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* ── Hint ─── */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(400)}
        style={[s.hint, { backgroundColor: accentHex + '0C', borderColor: accentHex + '25' }]}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color={accentHex} />
        <AppText variant="caption" color={colors.text.secondary} style={{ flex: 1, lineHeight: 17 }}>
          All your data stays on this device. Nothing is uploaded without your permission.
        </AppText>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'], gap: Spacing['4'] },
  heroWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1.5, borderStyle: 'dashed' },
  iconCircle: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 12 },
    }),
  },
  badge: { position: 'absolute', bottom: 14, right: 10, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  textBlock: { alignItems: 'center', gap: Spacing['2'] },
  subtitle: { maxWidth: 280, lineHeight: 20 },
  stepsCol: { alignSelf: 'stretch', gap: Spacing['2'] },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['3'],
    padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  stepIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing['2'], padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
  },
});
