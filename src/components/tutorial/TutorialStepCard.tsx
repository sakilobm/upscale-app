/**
 * @file TutorialStepCard.tsx
 * @architecture Presentation Layer — UI Component
 * @description Floating guide description card presenting onboarding text, visual demo, and nav controls.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
 */

import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { TourDefinition } from '@features/tutorial/hooks/useTutorialSpotlight';
import { TourStep } from '@features/tutorial/store/tutorialStore';
import { AnimatedSwipeHand } from './AnimatedSwipeHand';
import { Spacing, Radius } from '@constants/index';

interface TutorialStepCardProps {
  colors: any;
  isDark: boolean;
  cardStyle: any;
  cardTopPosition: number;
  tourDef: TourDefinition;
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  isLastStep: boolean;
  handleSkip: () => void;
  handleNext: () => void;
  handlePrev: () => void;
}

export const TutorialStepCard = React.memo(({
  colors,
  isDark,
  cardStyle,
  cardTopPosition,
  tourDef,
  step,
  currentStepIndex,
  totalSteps,
  isLastStep,
  handleSkip,
  handleNext,
  handlePrev,
}: TutorialStepCardProps) => {
  return (
    <Animated.View
      style={[
        s.card,
        cardStyle,
        {
          top: cardTopPosition,
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
          {Array.from({ length: totalSteps }).map((_, idx) => (
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
            <Pressable onPress={handlePrev} style={[s.navBtn, { backgroundColor: colors.glass.backgroundMid }]}>
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
  );
});

const s = StyleSheet.create({
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
