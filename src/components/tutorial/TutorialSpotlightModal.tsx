/**
 * @file TutorialSpotlightModal.tsx
 * @architecture Presentation Layer — UI Component Modal
 * @description Global interactive onboarding tutorial modal with dynamic element spotlighting.
 *   Renders glowing targeted highlight rings over active UI components (Balance Card, FAB, List Rows).
 * @associatedFiles src/features/tutorial/store/tutorialStore.ts, src/components/tutorial/AnimatedSwipeHand.tsx
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@hooks/useTheme';
import { AppText } from '@components/AppText';
import { useTutorialStore, TOUR_DEFINITIONS, SpotlightArea } from '@features/tutorial/store/tutorialStore';
import { AnimatedSwipeHand } from './AnimatedSwipeHand';
import { Spacing, Radius } from '@constants/index';

export function TutorialSpotlightModal() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  const activeTourId = useTutorialStore((s) => s.activeTourId);
  const currentStepIndex = useTutorialStore((s) => s.currentStepIndex);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const prevStep = useTutorialStore((s) => s.prevStep);
  const skipTour = useTutorialStore((s) => s.skipTour);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  const isVisible = !!activeTourId;

  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 240 });
      scale.value = withSpring(1, { damping: 22, stiffness: 220 });

      // Continuous pulsing aura for the highlighted spotlight target
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      scale.value = withTiming(0.9, { duration: 180 });
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
    }
  }, [isVisible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!isVisible || !activeTourId) return null;

  const tourDef = TOUR_DEFINITIONS[activeTourId];
  const step = tourDef.steps[currentStepIndex];
  const totalSteps = tourDef.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nextStep();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipTour();
  };

  // Compute spotlight target dimensions & card vertical layout dynamically
  const getLayoutConfig = (area: SpotlightArea) => {
    switch (area) {
      case 'header-card':
        return {
          spotlightStyle: {
            top: insets.top + 70,
            left: 16,
            width: screenWidth - 32,
            height: 215,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insets.top + 305,
        };
      case 'quick-add':
        return {
          spotlightStyle: {
            bottom: 85,
            right: 18,
            width: 68,
            height: 68,
            borderRadius: 34,
          },
          cardTopPosition: insets.top + 130,
        };
      case 'stats-card':
        return {
          spotlightStyle: {
            top: insets.top + 310,
            left: 16,
            width: screenWidth - 32,
            height: 90,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insets.top + 130,
        };
      case 'list-row':
        return {
          spotlightStyle: {
            top: insets.top + 390,
            left: 16,
            width: screenWidth - 32,
            height: 140,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insets.top + 120,
        };
      case 'summary-card':
        return {
          spotlightStyle: {
            top: insets.top + 70,
            left: 16,
            width: screenWidth - 32,
            height: 170,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insets.top + 255,
        };
      case 'chart-area':
        return {
          spotlightStyle: {
            top: insets.top + 90,
            left: 16,
            width: screenWidth - 32,
            height: 230,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insets.top + 335,
        };
    }
  };

  const layoutConfig = getLayoutConfig(step.spotlightArea);

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleSkip}>
      <View style={s.overlay} pointerEvents="box-none">
        {/* Dark dim backdrop */}
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.78)' }]} onPress={handleSkip} />

        {/* 🌟 Glowing Target Spotlight Frame */}
        <Animated.View
          style={[
            s.spotlightRing,
            layoutConfig.spotlightStyle as any,
            pulseStyle,
            {
              borderColor: colors.brand.primary,
              backgroundColor: colors.brand.primary + '15',
              shadowColor: colors.brand.primary,
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              s.targetBadge,
              { backgroundColor: colors.brand.primary },
              step.spotlightArea === 'quick-add' && { top: -28, left: -20, width: 108, justifyContent: 'center' },
            ]}
          >
            <Ionicons name="sparkles" size={11} color={colors.white} />
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{ color: colors.white, fontWeight: '800', fontSize: 10, flexShrink: 0 }}
            >
              {step.targetLabel}
            </AppText>
          </View>
        </Animated.View>

        {/* Floating Interactive Guide Card */}
        <Animated.View
          style={[
            s.card,
            cardStyle,
            {
              top: layoutConfig.cardTopPosition,
              backgroundColor: colors.surface.sheet,
              borderColor: colors.glass.borderStrong,
              shadowColor: colors.black,
            },
          ]}
        >
          {/* Header Row */}
          <View style={s.headerRow}>
            <View style={[s.badge, { backgroundColor: colors.brand.primary + '18' }]}>
              <Ionicons name={tourDef.icon as any} size={14} color={colors.brand.primary} />
              <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 11 }}>
                {tourDef.name.toUpperCase()}
              </AppText>
            </View>

            <Pressable onPress={handleSkip} hitSlop={12} style={s.skipBtn}>
              <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>
                Skip Tour
              </AppText>
            </Pressable>
          </View>

          {/* Target Title & Description */}
          <View style={s.body}>
            <AppText variant="headingSM" color={colors.text.primary} style={{ fontWeight: '800' }}>
              {step.title}
            </AppText>
            <AppText variant="bodySM" color={colors.text.secondary} style={s.desc}>
              {step.description}
            </AppText>
          </View>

          {/* Gesture Visual Animation Demo */}
          {step.gestureHint && (
            <View style={[s.demoBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <AnimatedSwipeHand type={step.gestureHint} />
            </View>
          )}

          {/* Footer Controls & Progress */}
          <View style={s.footer}>
            {/* Step Dots */}
            <View style={s.dotsRow}>
              {tourDef.steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    s.dot,
                    {
                      backgroundColor: idx === currentStepIndex ? colors.brand.primary : colors.glass.borderStrong,
                      width: idx === currentStepIndex ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={s.btnGroup}>
              {currentStepIndex > 0 && (
                <Pressable onPress={prevStep} style={[s.navBtn, { backgroundColor: colors.glass.backgroundMid }]}>
                  <Ionicons name="chevron-back" size={16} color={colors.text.primary} />
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                style={[
                  s.nextBtn,
                  { backgroundColor: colors.brand.primary },
                ]}
              >
                <AppText variant="labelMD" style={{ color: colors.white, fontWeight: '800' }}>
                  {isLastStep ? 'Got It!' : 'Next'}
                </AppText>
                <Ionicons name={isLastStep ? 'checkmark' : 'arrow-forward'} size={16} color={colors.white} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: Spacing['5'],
  },
  spotlightRing: {
    position: 'absolute',
    borderWidth: 2,
    zIndex: 10,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  targetBadge: {
    position: 'absolute',
    top: -12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  card: {
    position: 'absolute',
    left: Spacing['5'],
    right: Spacing['5'],
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing['5'],
    gap: Spacing['4'],
    zIndex: 20,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  skipBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  body: {
    gap: Spacing['1'],
  },
  desc: {
    lineHeight: 20,
    opacity: 0.88,
  },
  demoBox: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing['2'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing['2'],
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing['4'],
    paddingVertical: 10,
    borderRadius: Radius.xl,
  },
});
