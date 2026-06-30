/**
 * @file SpotlightFrame.tsx
 * @architecture Presentation Layer — UI Component
 * @description Glowing overlay frame highlighting target UI components during walkthroughs.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { SpotlightArea } from '@features/tutorial/store/tutorialStore';
import { SpotlightStyle } from '@features/tutorial/utils/layout';
import { Radius } from '@constants/index';

interface SpotlightFrameProps {
  colors: any;
  pulseStyle: any;
  spotlightStyle: SpotlightStyle;
  targetLabel: string;
  spotlightArea: SpotlightArea;
  badgeStyle?: any;
}

export const SpotlightFrame = React.memo(({
  colors,
  pulseStyle,
  spotlightStyle,
  targetLabel,
  spotlightArea,
  badgeStyle,
}: SpotlightFrameProps) => {
  return (
    <Animated.View
      style={[
        s.spotlightRing,
        spotlightStyle as any,
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
          badgeStyle,
        ]}
      >
        <Ionicons name="sparkles" size={11} color={colors.white} />
        <AppText
          variant="caption"
          numberOfLines={1}
          style={{ color: colors.white, fontWeight: '800', fontSize: 10, flexShrink: 0 }}
        >
          {targetLabel}
        </AppText>
      </View>
    </Animated.View>
  );
});

const s = StyleSheet.create({
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
});
