/**
 * @file ProfileHero.tsx
 * @architecture Presentation Layer — UI Component
 * @description Gradient hero card at the top of the Profile screen. Displays the
 *   user's avatar initials, full name, email, and stat badges (member since, tx count,
 *   currency). Tap the avatar to trigger name editing.
 * @associatedFiles src/app/(tabs)/profile.tsx, src/features/profile/hooks/useProfileScreen.ts
 */

import React, { useEffect, type ComponentProps } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_SYMBOLS } from '@store/types';
import { Spacing, Radius } from '@constants/index';
import type { CurrencyCode } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  initials:    string;
  fullName:    string;
  email:       string;
  memberSince: string;
  txCount:     number;
  currency:    CurrencyCode;
  onEditPress: () => void;
}

function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const ty      = useSharedValue(18);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 360 }));
    ty.value      = withDelay(delay, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: ty.value }],
  }));
}

export function ProfileHero({ initials, fullName, email, memberSince, txCount, currency, onEditPress }: Props) {
  const { colors, isDark } = useTheme();
  const anim = useEntrance(0);

  const gradient: [string, string] = isDark
    ? ['#1A1040', '#0D0826']
    : [colors.brand.primary, '#A8E000'];

  const badges: { icon: IoniconName; label: string }[] = [
    { icon: 'calendar-outline',        label: `Since ${memberSince}` },
    { icon: 'swap-horizontal-outline', label: `${txCount} transactions` },
    { icon: 'cash-outline',            label: `${currency} ${CURRENCY_SYMBOLS[currency]}` },
  ];

  return (
    <Animated.View style={[s.hero, anim]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[s.blobTL, { backgroundColor: isDark ? 'rgba(108,99,255,0.22)' : 'rgba(255,255,255,0.30)' }]} />
      <View style={[s.blobBR, { backgroundColor: isDark ? 'rgba(56,189,248,0.10)'  : 'rgba(0,0,0,0.06)' }]} />
      <View style={[StyleSheet.absoluteFill, s.border, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)' }]} pointerEvents="none" />

      <View style={s.inner}>
        <Pressable onPress={onEditPress} style={s.avatarWrap}>
          <LinearGradient
            colors={isDark ? ['#6C63FF', '#A78BFA'] : ['#000000', '#1A1A2E']}
            style={s.avatarCircle}
          >
            <AppText style={s.avatarText}>{initials}</AppText>
          </LinearGradient>
          <View style={[s.editBadge, { backgroundColor: isDark ? colors.brand.primary : '#000000' }]}>
            <Ionicons name="pencil" size={9} color="#FFFFFF" />
          </View>
        </Pressable>

        <AppText variant="headingLG" style={[s.name, { color: isDark ? '#F1F5F9' : '#0A0A0A' }]}>
          {fullName}
        </AppText>
        <AppText variant="bodySM" style={{ color: isDark ? 'rgba(203,213,225,0.75)' : 'rgba(0,0,0,0.55)', marginTop: 2 }}>
          {email}
        </AppText>

        <View style={s.badges}>
          {badges.map((b) => (
            <View
              key={b.label}
              style={[s.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }]}
            >
              <Ionicons name={b.icon} size={11} color={isDark ? 'rgba(203,213,225,0.80)' : 'rgba(0,0,0,0.58)'} />
              <AppText style={{ color: isDark ? 'rgba(203,213,225,0.80)' : 'rgba(0,0,0,0.60)', fontSize: 11 }}>
                {b.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  hero: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  border: { ...StyleSheet.absoluteFill, borderRadius: Radius['2xl'], borderWidth: 1 },
  blobTL: { position: 'absolute', top: -40, left: -30, width: 160, height: 160, borderRadius: 80 },
  blobBR: { position: 'absolute', bottom: -30, right: -20, width: 120, height: 120, borderRadius: 60 },
  inner:  { padding: Spacing['6'], alignItems: 'center', gap: Spacing['2'] },
  avatarWrap:   { marginBottom: Spacing['2'], position: 'relative' },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)',
  },
  name:   { fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  badges: { flexDirection: 'row', gap: Spacing['2'], flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing['2'] },
  badge:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
});
