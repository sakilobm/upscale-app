/**
 * @file TutorialSpotlightModal.tsx
 * @architecture Presentation Layer — UI Component Shell
 * @description Global interactive onboarding tutorial modal with dynamic element spotlighting.
 *   Consumes the useTutorialSpotlight headless hook and delegates rendering to atomic components.
 * @associatedFiles src/features/tutorial/store/tutorialStore.ts, src/features/tutorial/hooks/useTutorialSpotlight.ts
 */

import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useTutorialSpotlight } from '@features/tutorial/hooks/useTutorialSpotlight';
import { useTutorialStore } from '@features/tutorial/store/tutorialStore';
import { SpotlightFrame } from './SpotlightFrame';
import { TutorialStepCard } from './TutorialStepCard';
import { TutorialLoader } from './TutorialLoader';
import { Spacing } from '@constants/index';

export function TutorialSpotlightModal() {
  const isLaunching = useTutorialStore((s) => s.isLaunching);
  const {
    isVisible,
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
  } = useTutorialSpotlight();

  if (isLaunching) {
    return <TutorialLoader colors={colors} isDark={isDark} />;
  }

  if (!isVisible || !tourDef || !step || !layoutConfig) {
    return null;
  }

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={handleSkip}>
      <View style={s.overlay} pointerEvents="box-none">
        {/* Dark dim backdrop */}
        <Pressable 
          style={StyleSheet.absoluteFill} 
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.78)' }]} />
        </Pressable>

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
          handleNext={handleNext}
          handlePrev={handlePrev}
        />
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
