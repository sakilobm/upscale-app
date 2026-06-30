/**
 * @file TutorialSpotlightModal.tsx
 * @architecture Presentation Layer — UI Component Shell
 * @description Global interactive onboarding tutorial modal with dynamic element spotlighting.
 *   Consumes the useTutorialSpotlight headless hook and delegates rendering to atomic components.
 * @associatedFiles src/features/tutorial/store/tutorialStore.ts, src/features/tutorial/hooks/useTutorialSpotlight.ts
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTutorialSpotlight } from '@features/tutorial/hooks/useTutorialSpotlight';
import { useTutorialStore, TOUR_SEQUENCE, TOUR_DEFINITIONS, TourId } from '@features/tutorial/store/tutorialStore';
import { SpotlightFrame } from './SpotlightFrame';
import { TutorialStepCard } from './TutorialStepCard';
import { TutorialLoader } from './TutorialLoader';
import { TutorialCompletionCard } from './TutorialCompletionCard';
import { Spacing } from '@constants/index';

const TOUR_ROUTES: Record<string, string> = {
  home: '/(tabs)',
  ledger: '/(tabs)/ledger',
  budget: '/(tabs)/budget',
  analytics: '/analytics',
  profile: '/(tabs)/profile',
};

export function TutorialSpotlightModal() {
  const isLaunching = useTutorialStore((s) => s.isLaunching);
  const {
    isVisible,
    activeTourId,
    tourDef,
    step,
    currentStepIndex,
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
    transitionToTour,
  } = useTutorialSpotlight();

  const [showCompletion, setShowCompletion] = useState(false);

  // Reset completion state when activeTourId changes or closes
  useEffect(() => {
    if (!isVisible) {
      setShowCompletion(false);
    }
  }, [isVisible]);

  if (isLaunching) {
    return <TutorialLoader colors={colors} isDark={isDark} />;
  }

  if (!isVisible || !tourDef || !step || !layoutConfig) {
    return null;
  }

  // Determine next sequential tour
  const currentTourIndex = TOUR_SEQUENCE.indexOf(activeTourId || 'home');
  const nextTourId = (currentTourIndex !== -1 && currentTourIndex + 1 < TOUR_SEQUENCE.length) 
    ? TOUR_SEQUENCE[currentTourIndex + 1] 
    : null;
  const nextTourDef = nextTourId ? TOUR_DEFINITIONS[nextTourId] : null;
  const nextTourRoute = nextTourId ? TOUR_ROUTES[nextTourId] : null;

  const onNext = () => {
    if (isLastStep) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setShowCompletion(true);
    } else {
      handleNext();
    }
  };

  const handleStartNextTour = () => {
    if (nextTourId && nextTourRoute) {
      transitionToTour(nextTourId, nextTourRoute);
    }
  };

  const handleExitTour = () => {
    handleSkip(); // Cleans up demo data and navigates back to Profile/Guides list
  };

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleExitTour}>
      <View style={s.overlay} pointerEvents="box-none">
        {/* Dark dim backdrop */}
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={showCompletion ? handleExitTour : undefined}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.78)' }]} />
        </Pressable>

        {showCompletion ? (
          /* Tour Completion success card */
          <TutorialCompletionCard
            colors={colors}
            isDark={isDark}
            cardStyle={cardStyle}
            tourName={tourDef.name}
            nextTourName={nextTourDef ? nextTourDef.name : null}
            onStartNextTour={handleStartNextTour}
            onExitTour={handleExitTour}
          />
        ) : (
          <>
            {/* 🌟 Glowing Target Spotlight Frame */}
            <SpotlightFrame
              colors={colors}
              pulseStyle={pulseStyle}
              spotlightStyle={layoutConfig.spotlightStyle}
              targetLabel={step.targetLabel}
              spotlightArea={step.spotlightArea}
              badgeStyle={layoutConfig.badgeStyle}
            />

            {/* Floating Interactive Guide Card */}
            <TutorialStepCard
              colors={colors}
              isDark={isDark}
              cardStyle={cardStyle}
              cardTopPosition={layoutConfig.cardTopPosition}
              tourDef={tourDef}
              step={step}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              isLastStep={isLastStep}
              handleSkip={handleSkip}
              handleNext={onNext}
              handlePrev={handlePrev}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: Spacing['5'],
  },
});
