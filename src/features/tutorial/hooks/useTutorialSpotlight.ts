/**
 * @file useTutorialSpotlight.ts
 * @architecture Business Logic Layer — Feature Hook
 * @description Headless hook orchestrating interactive onboarding spotlight steps.
 *   Manages state transitions, pulsing ring Reanimated animations, device haptics, and layout mappings.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx, src/features/tutorial/store/tutorialStore.ts
 */

import { useEffect } from 'react';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@hooks/useTheme';
import { useTutorialStore, TOUR_DEFINITIONS, SpotlightArea, TourId, TourStep } from '../store/tutorialStore';
import { getSpotlightLayoutConfig, LayoutConfig } from '../utils/layout';

export interface TourDefinition {
  name: string;
  icon: string;
  steps: TourStep[];
}

export interface UseTutorialSpotlightReturn {
  isVisible: boolean;
  activeTourId: TourId | null;
  currentStepIndex: number;
  tourDef: TourDefinition | null;
  step: TourStep | null;
  totalSteps: number;
  isLastStep: boolean;
  layoutConfig: LayoutConfig | null;
  cardStyle: any;
  pulseStyle: any;
  colors: any;
  isDark: boolean;
  handleNext: () => void;
  handlePrev: () => void;
  handleSkip: () => void;
}

/**
 * Headless Hook that isolates state, Reanimated animation drivers, layout computations,
 * and haptic feedback triggers for the spotlight onboarding UI.
 */
export function useTutorialSpotlight(): UseTutorialSpotlightReturn {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;

  // Zustand Store selectors
  const activeTourId = useTutorialStore((s) => s.activeTourId);
  const currentStepIndex = useTutorialStore((s) => s.currentStepIndex);
  const nextStep = useTutorialStore((s) => s.nextStep);
  const prevStep = useTutorialStore((s) => s.prevStep);
  const skipTour = useTutorialStore((s) => s.skipTour);

  // Animations shared values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  const isVisible = !!activeTourId;

  // Animation triggers on visibility change
  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 240 });
      scale.value = withSpring(1, { damping: 22, stiffness: 220 });

      // Continuous pulsing aura for spotlight
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

  // Derived styles for presentation
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Resolve active tour configurations
  const tourDef = activeTourId ? TOUR_DEFINITIONS[activeTourId] : null;
  const step = tourDef ? tourDef.steps[currentStepIndex] : null;
  const totalSteps = tourDef ? tourDef.steps.length : 0;
  const isLastStep = tourDef ? currentStepIndex === totalSteps - 1 : false;

  // Compute spotlight target coordinates dynamically
  const layoutConfig = (step && activeTourId) 
    ? getSpotlightLayoutConfig(step.spotlightArea, activeTourId, insets.top, screenWidth)
    : null;

  // Visual/Tactile Interaction handlers
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nextStep();
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    prevStep();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    skipTour();
  };

  return {
    isVisible,
    activeTourId,
    currentStepIndex,
    tourDef,
    step,
    totalSteps,
    isLastStep,
    layoutConfig,
    cardStyle,
    pulseStyle,
    colors,
    isDark,
    handleNext,
    handlePrev,
    handleSkip,
  };
}
