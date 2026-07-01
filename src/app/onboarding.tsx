/**
 * @file onboarding.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Onboarding screen shown on first launch. Pure declarative orchestrator:
 *   reads a single contract from useOnboardingScreen and renders extracted slide
 *   components. Horizontal slide transition driven by a Reanimated shared value.
 *   Zero business logic, zero raw useState, zero store imports.
 * @associatedFiles src/features/onboarding/hooks/useOnboardingScreen.ts,
 *   src/components/onboarding/FeatureSlide.tsx, src/components/onboarding/SetupSlide.tsx
 */

import { useEffect } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeInDown,
} from 'react-native-reanimated';
import {
  useOnboardingScreen,
  FEATURE_SLIDES,
  ONBOARDING_TOTAL,
} from '@features/onboarding/hooks/useOnboardingScreen';
import { FeatureSlide } from '@components/onboarding/FeatureSlide';
import { SetupSlide } from '@components/onboarding/SetupSlide';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useSplashStore } from '@store/splashStore';

const { width: SW } = Dimensions.get('window');
const SLIDE_W       = SW;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const setAppReady = useSplashStore((s) => s.setAppReady);

  useEffect(() => {
    setAppReady(true);
  }, [setAppReady]);

  const {
    step, isSetupStep, name, currency, setName, setCurrency,
    avatarId, setAvatarId, handlers,
  } = useOnboardingScreen();

  // ── Horizontal slide animation ──
  const translateX = useSharedValue(0);
  useEffect(() => {
    translateX.value = withSpring(-step * SLIDE_W, { damping: 22, stiffness: 140, mass: 0.9 });
  }, [step]);
  const containerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  // ── Track if onboarding screen is active globally ──
  useEffect(() => {
    (globalThis as any).__isOnboardingActive = true;
    return () => {
      (globalThis as any).__isOnboardingActive = false;
    };
  }, []);

  // ── Active slide gradient accent colour ──
  const slideKey       = FEATURE_SLIDES[Math.min(step, FEATURE_SLIDES.length - 1)]?.gradientKey ?? 'purpleViolet';
  const activeGradient = colors.gradients[slideKey] as any;
  const accentColor    = activeGradient[0];

  const btnBg        = colors.surface.sheet;
  const btnBorder    = colors.glass.border;
  const isFirstStep  = step === 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background.primary }]}>
      {/* ── Ambient background glow ── */}
      <Animated.View
        entering={FadeIn.duration(600)}
        style={[s.glow, { backgroundColor: accentColor + '14' }]}
        pointerEvents="none"
      />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* ── Top bar: logo + skip ── */}
        <Animated.View entering={FadeInDown.springify().damping(22).stiffness(140)} style={s.topBar}>
          <View style={s.logoRow}>
            <LinearGradient colors={colors.gradients.purpleViolet as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.logoMark, { shadowColor: colors.brand.accent }]}>
              <Ionicons name="wallet" size={16} color={colors.white} />
            </LinearGradient>
            <AppText style={[s.brandName, { color: colors.text.primary }]}>WhereCash</AppText>
          </View>

          {!isSetupStep && (
            <Pressable onPress={handlers.skip} style={({ pressed }) => [s.skipBtn, { opacity: pressed ? 0.5 : 1 }]}>
              <AppText variant="labelMD" color={colors.text.tertiary}>Skip</AppText>
              <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
            </Pressable>
          )}
        </Animated.View>

        {/* ── Keyboard-aware wrapper: carousel + bottom shrink together ── */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* ── Slide carousel ── */}
          <View style={s.carouselClip}>
            <Animated.View style={[s.carouselTrack, containerStyle]}>
              {FEATURE_SLIDES.map((slide, i) => (
                <View key={i} style={{ width: SLIDE_W }}>
                  <FeatureSlide slide={slide} animKey={step === i ? step : -1} />
                </View>
              ))}
              {/* Setup slide */}
              <View style={{ width: SLIDE_W, height: '100%' }}>
                <SetupSlide
                  name={name}
                  currency={currency}
                  avatarId={avatarId}
                  onNameChange={setName}
                  onCurrencyChange={setCurrency}
                  onAvatarChange={setAvatarId}
                  animKey={isSetupStep ? step : -1}
                />
              </View>
            </Animated.View>
          </View>

          {/* ── Bottom controls ── */}
          <Animated.View entering={FadeInDown.springify().damping(22).stiffness(140).delay(200)} style={s.bottomArea}>
          {/* Progress dots */}
          <View style={s.dotsRow}>
            {Array.from({ length: ONBOARDING_TOTAL }).map((_, i) => {
              const isActive = i === step;
              return (
                <View
                  key={i}
                  style={[
                    s.dot,
                    isActive
                      ? { width: 24, backgroundColor: accentColor }
                      : { width: 6,  backgroundColor: accentColor + '35' },
                  ]}
                />
              );
            })}
          </View>

          {/* CTA row */}
          <View style={s.ctaRow}>
            {/* Back button */}
            {!isFirstStep && (
              <Pressable
                onPress={handlers.back}
                style={({ pressed }) => [s.backBtn, { backgroundColor: btnBg, borderColor: btnBorder, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text.secondary} />
              </Pressable>
            )}

            {/* Primary CTA */}
            <Pressable
              onPress={isSetupStep ? handlers.getStarted : handlers.next}
              style={({ pressed }) => [s.ctaBtn, { flex: isFirstStep ? 1 : undefined, opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={activeGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.ctaGradient}
              >
                {Platform.OS === 'ios' && (
                  <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                )}
                <AppText style={[s.ctaLabel, { color: colors.white }]}>
                  {isSetupStep ? 'Get Started' : 'Next'}
                </AppText>
                <Ionicons
                  name={isSetupStep ? 'rocket-outline' : 'arrow-forward'}
                  size={18}
                  color={colors.white}
                />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Terms hint on setup slide */}
          {isSetupStep && (
            <Animated.View entering={FadeInDown.duration(400).delay(300)} style={s.termsRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.text.tertiary} />
              <AppText variant="caption" color={colors.text.tertiary} align="center">
                Your data stays{' '}
                <AppText variant="caption" style={{ color: accentColor, fontWeight: '700' }}>
                  100% on-device
                </AppText>
                . No account required.
              </AppText>
            </Animated.View>
          )}
        </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },

  // Ambient glow
  glow: {
    position: 'absolute',
    top: -80, left: -80, right: -80,
    height: 380,
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
  },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  brandName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  skipBtn:   { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 6 },

  // Carousel
  carouselClip:  { flex: 1, overflow: 'hidden' },
  carouselTrack: { flexDirection: 'row', height: '100%' },

  // Bottom
  bottomArea: { paddingHorizontal: 24, paddingBottom: 8, gap: 20 },
  dotsRow:    { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot:        { height: 6, borderRadius: 3 },

  ctaRow:  { flexDirection: 'row', gap: 12 },
  backBtn: {
    width: 54, height: 54, borderRadius: 17, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtn:     { flexGrow: 1, borderRadius: 17, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, gap: 10, borderRadius: 17,
  },
  ctaLabel: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  termsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
