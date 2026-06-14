/**
 * @file AnimatedIcon.tsx
 * @architecture Presentation Layer — UI Component
 * @description Animated budget-status icon that pulses when the budget is exceeded.
 *   Used in the Budget screen's monthly overview card header.
 * @associatedFiles src/app/(tabs)/budget.tsx
 */

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  iconName:  any;
  iconColor: string;
  badgeBg:   string;
  isOver:    boolean;
}

export function AnimatedIcon({ iconName, iconColor, badgeBg, isOver }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isOver) {
      scale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 600 }), withTiming(1.0, { duration: 600 })),
        -1, true,
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isOver]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[s.badge, { backgroundColor: badgeBg }, animatedStyle]}>
      <Ionicons name={iconName} size={18} color={iconColor} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
