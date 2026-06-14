/**
 * @file SectionCard.tsx
 * @architecture Presentation Layer — Reusable UI Component
 * @description A grouped-settings card with an optional section label and staggered
 *   entrance animation. Used by the Profile screen to visually group related settings.
 * @associatedFiles src/app/(tabs)/profile.tsx, src/features/profile/hooks/useProfileScreen.ts
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

interface Props {
  title?:    string;
  children:  React.ReactNode;
  delay?:    number;
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

export function SectionCard({ title, children, delay = 0 }: Props) {
  const { colors, isDark } = useTheme();
  const anim = useEntrance(delay);

  return (
    <Animated.View style={anim}>
      {title && (
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.label}>
          {title.toUpperCase()}
        </AppText>
      )}
      <View
        style={[
          s.card,
          {
            backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
            borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 11, letterSpacing: 0.8, marginBottom: Spacing['2'], marginLeft: Spacing['1'] },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
});
