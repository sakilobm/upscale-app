/**
 * @file LedgerEmptyState.tsx
 * @architecture Presentation Layer — Feature Component
 * @description Animated empty-state illustration shown inside the Ledger screen when no
 *   entries exist for the currently active tab. Renders a gradient hero icon, explanatory
 *   text, three feature-highlight rows, and a contextual call-to-action hint.
 *   All configuration (icons, copy, gradients) is co-located as static data — no state,
 *   no side-effects, no logic. Purely declarative.
 * @associatedFiles
 *   src/app/(tabs)/ledger.tsx,
 *   src/features/ledger/types.ts
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing } from '@constants/Dimensions';
import type { LedgerTab } from '../types';

// ─── Static configuration ─────────────────────────────────────────────────────

const CONFIG: Record<LedgerTab, {
  icon:     React.ComponentProps<typeof Ionicons>['name'];
  gradKey:  'indigoViolet' | 'income' | 'amberYellow';
  title:    string;
  subtitle: string;
  hint:     string;
  features: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[];
}> = {
  owed_to_me: {
    icon:     'people-outline',
    gradKey:  'indigoViolet',
    title:    'No one owes you',
    subtitle: 'Record hand-to-hand money you lent to friends or family.',
    hint:     'Tap + to add an entry',
    features: [
      { icon: 'person-add-outline',     text: 'Add who owes you and how much' },
      { icon: 'card-outline',           text: 'Track partial returns over time' },
      { icon: 'checkmark-done-outline', text: 'Mark as settled when paid back' },
    ],
  },
  i_owe: {
    icon:     'happy-outline',
    gradKey:  'income',
    title:    "You're debt-free!",
    subtitle: "No outstanding debts. You don't owe anyone right now.",
    hint:     'Tap + if you borrow money',
    features: [
      { icon: 'cash-outline',           text: 'Log money you borrowed' },
      { icon: 'time-outline',           text: 'Set a due date as a reminder' },
      { icon: 'checkmark-done-outline', text: 'Settle when you pay it back' },
    ],
  },
  loans: {
    icon:     'business-outline',
    gradKey:  'amberYellow',
    title:    'No loans tracked',
    subtitle: 'Track mortgages, car loans, or money you have lent out.',
    hint:     'Tap + to add a loan',
    features: [
      { icon: 'home-outline',           text: 'Track home or car loans' },
      { icon: 'calculator-outline',     text: 'See EMI and progress at a glance' },
      { icon: 'trending-down-outline',  text: 'Record each payment made' },
    ],
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  variant: LedgerTab;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LedgerEmptyState({ variant }: Props) {
  const { colors } = useTheme();
  const cfg    = CONFIG[variant];
  const grad   = colors.gradients[cfg.gradKey] as unknown as [string, string];
  const accent = grad[0];

  return (
    <View style={s.root}>
      {/* Hero icon */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140)} style={s.heroWrap}>
        <View style={[s.outerRing, { borderColor: accent + '25' }]} />
        <View style={[s.iconCircle, { overflow: 'hidden', shadowColor: colors.black }]}>
          <LinearGradient
            colors={grad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name={cfg.icon} size={36} color={colors.white} />
        </View>
        <View style={[s.badge, { backgroundColor: accent + '18' }]}>
          <Ionicons name="add" size={14} color={accent} />
        </View>
      </Animated.View>

      {/* Copy */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={s.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">
          {cfg.title}
        </AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={s.subtitle}>
          {cfg.subtitle}
        </AppText>
      </Animated.View>

      {/* Feature rows */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(160)} style={s.featuresCol}>
        {cfg.features.map(({ icon, text }) => (
          <View key={text} style={[s.featureRow, { backgroundColor: colors.surface.sheet, borderColor: accent + '20' }]}>
            <View style={[s.featureIcon, { backgroundColor: accent + '15' }]}>
              <Ionicons name={icon} size={15} color={accent} />
            </View>
            <AppText variant="bodySM" color={colors.text.secondary} style={{ flex: 1 }}>
              {text}
            </AppText>
          </View>
        ))}
      </Animated.View>

      {/* CTA hint */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(240)}
        style={[s.hint, { backgroundColor: accent + '0C', borderColor: accent + '28' }]}
      >
        <Ionicons name="add-circle-outline" size={15} color={accent} />
        <AppText variant="caption" color={colors.text.secondary}>
          <AppText variant="caption" style={{ color: accent, fontWeight: '700' }}>{cfg.hint}</AppText>
          {' '}using the button below
        </AppText>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { alignItems: 'center', paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], gap: Spacing['4'] },

  heroWrap:  { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1.5, borderStyle: 'dashed' },
  iconCircle: {
    width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  badge: { position: 'absolute', bottom: 14, right: 10, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  textBlock: { alignItems: 'center', gap: Spacing['2'] },
  subtitle:  { maxWidth: 280, lineHeight: 20 },

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
});
