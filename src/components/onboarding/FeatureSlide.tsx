/**
 * @file FeatureSlide.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Single feature slide for the onboarding carousel. Renders a large
 *   gradient icon circle with a badge, a heading, and a subtitle. Entrance animations
 *   are staggered via FadeInDown with a shared `animKey` prop so they re-fire on slide
 *   change (remount via key).
 * @associatedFiles src/app/onboarding.tsx
 */

import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import type { OnboardingSlideData } from '@features/onboarding/hooks/useOnboardingScreen';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const { width: SW } = Dimensions.get('window');

interface Props {
  slide:    OnboardingSlideData;
  animKey:  number;
}

export function FeatureSlide({ slide, animKey }: Props) {
  const { colors } = useTheme();
  const gradient = colors.gradients[slide.gradientKey] as unknown as [string, string];
  const accent = gradient[0];

  return (
    <View style={s.root}>
      {/* ── Icon hero ── */}
      <Animated.View key={`hero-${animKey}`} entering={FadeInDown.springify().damping(20).stiffness(140)} style={s.heroWrap}>
        {/* Dashed orbit ring */}
        <View style={[s.outerRing, { borderColor: accent + '38' }]} />
        <View style={[s.innerRing, { borderColor: accent + '20' }]} />

        {/* Gradient circle */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[s.iconCircle, { shadowColor: colors.black }]}
        >
          <Ionicons name={slide.icon as IoniconName} size={42} color={colors.white} />
        </LinearGradient>

        {/* Badge */}
        <View style={[s.badge, { backgroundColor: accent + '22', borderColor: accent + '40' }]}>
          <Ionicons name={slide.badge as IoniconName} size={15} color={accent} />
        </View>
      </Animated.View>

      {/* ── Text ── */}
      <Animated.View key={`text-${animKey}`} entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={s.textBlock}>
        <AppText variant="headingLG" color={colors.text.primary} align="center" style={s.title}>
          {slide.title}
        </AppText>
        <AppText variant="bodyMD" color={colors.text.secondary} align="center" style={s.subtitle}>
          {slide.subtitle}
        </AppText>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  heroWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  outerRing: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  innerRing: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    borderWidth: 1,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.28, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  badge: {
    position: 'absolute', bottom: 18, right: 14,
    width: 36, height: 36, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', gap: 12 },
  title:     { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 36 },
  subtitle:  { lineHeight: 24, maxWidth: SW - 72 },
});
