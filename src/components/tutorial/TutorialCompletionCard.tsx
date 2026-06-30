/**
 * @file TutorialCompletionCard.tsx
 * @architecture Presentation Layer — UI Component
 * @description Card presented at the end of a walkthrough suggesting the next sequence tour or exit.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
 */

import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { Spacing, Radius } from '@constants/index';

interface TutorialCompletionCardProps {
  colors: any;
  isDark: boolean;
  cardStyle: any;
  tourName: string;
  nextTourName: string | null;
  onStartNextTour: () => void;
  onExitTour: () => void;
}

export const TutorialCompletionCard = React.memo(({
  colors,
  isDark,
  cardStyle,
  tourName,
  nextTourName,
  onStartNextTour,
  onExitTour,
}: TutorialCompletionCardProps) => {
  return (
    <Animated.View
      style={[
        s.card,
        cardStyle,
        {
          backgroundColor: colors.surface.sheet,
          borderColor: colors.glass.borderStrong,
          shadowColor: colors.black,
        },
      ]}
    >
      {/* Trophy Badge */}
      <View style={[s.badge, { backgroundColor: colors.brand.primary + '18' }]}>
        <Ionicons name="trophy" size={28} color={colors.brand.primary} />
      </View>

      {/* Completion Text */}
      <View style={s.textGroup}>
        <AppText 
          variant="headingSM" 
          color={colors.text.primary} 
          style={{ fontWeight: '800', textAlign: 'center' }}
        >
          Walkthrough Completed!
        </AppText>
        <AppText 
          variant="bodySM" 
          color={colors.text.secondary} 
          style={{ textAlign: 'center', lineHeight: 18 }}
        >
          You've successfully mastered the <AppText style={{ fontWeight: '700' }}>{tourName}</AppText>.
        </AppText>
      </View>

      {/* Action Buttons Stack */}
      <View style={s.btnStack}>
        {nextTourName ? (
          <Pressable
            onPress={onStartNextTour}
            style={({ pressed }) => [
              s.primaryBtn,
              { 
                backgroundColor: colors.brand.primary,
                opacity: pressed ? 0.85 : 1,
              }
            ]}
          >
            <AppText variant="labelMD" style={{ color: colors.white, fontWeight: '800' }}>
              Continue to {nextTourName.replace(' Tour', '')}
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onExitTour}
          style={({ pressed }) => [
            s.secondaryBtn,
            { 
              borderColor: colors.glass.borderStrong,
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              opacity: pressed ? 0.85 : 1,
            }
          ]}
        >
          <AppText variant="labelMD" color={colors.text.secondary} style={{ fontWeight: '700' }}>
            Exit to Settings
          </AppText>
        </Pressable>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
  card: {
    position: 'absolute',
    left: Spacing['5'],
    right: Spacing['5'],
    top: '32%',
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing['6'],
    gap: Spacing['5'],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 16 },
    }),
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    gap: 6,
    alignItems: 'center',
  },
  btnStack: {
    width: '100%',
    gap: Spacing['3'],
    marginTop: Spacing['1'],
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
});
