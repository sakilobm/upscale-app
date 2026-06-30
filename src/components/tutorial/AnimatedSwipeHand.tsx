/**
 * @file AnimatedSwipeHand.tsx
 * @architecture Presentation Layer — UI Component
 * @description Smooth Reanimated 4 gesture cursor demonstration component.
 *   Simulates finger drag gestures (swipe left, swipe right, or tap) to visually teach users app actions.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { AppText } from '@components/AppText';

interface Props {
  type: 'swipe-left' | 'swipe-right' | 'tap';
}

export function AnimatedSwipeHand({ type }: Props) {
  const { colors } = useTheme();
  const tx      = useSharedValue(0);
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (type === 'swipe-left') {
      tx.value = 40;
      tx.value = withRepeat(
        withSequence(
          withTiming(-50, { duration: 1200, easing: Easing.out(Easing.cubic) }),
          withTiming(40,  { duration: 400,  easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withSpring(1.15, { damping: 10 }),
          withSpring(0.95, { damping: 10 }),
          withSpring(1,    { damping: 10 })
        ),
        -1,
        true
      );
    } else if (type === 'swipe-right') {
      tx.value = -40;
      tx.value = withRepeat(
        withSequence(
          withTiming(50,  { duration: 1200, easing: Easing.out(Easing.cubic) }),
          withTiming(-40, { duration: 400,  easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
      scale.value = withRepeat(
        withSequence(
          withSpring(1.15, { damping: 10 }),
          withSpring(0.95, { damping: 10 }),
          withSpring(1,    { damping: 10 })
        ),
        -1,
        true
      );
    } else {
      // Tap animation
      scale.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 350 }),
          withTiming(1.2, { duration: 350 })
        ),
        -1,
        true
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 350 }),
          withTiming(0.3, { duration: 350 })
        ),
        -1,
        true
      );
    }

    return () => {
      cancelAnimation(tx);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [type]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { scale: scale.value }],
    opacity:   type === 'tap' ? opacity.value : 0.9,
  }));

  const labelText =
    type === 'swipe-left'
      ? 'Swipe Left'
      : type === 'swipe-right'
      ? 'Swipe Right'
      : 'Tap to Interact';

  return (
    <View style={s.container}>
      <Animated.View style={[s.cursorCircle, { backgroundColor: colors.brand.primary + '33', borderColor: colors.brand.primary }, animStyle]}>
        <Ionicons
          name={type === 'tap' ? 'finger-print' : 'hand-left-outline'}
          size={24}
          color={colors.brand.primary}
        />
      </Animated.View>
      <View style={[s.pill, { backgroundColor: colors.surface.sheet, borderColor: colors.glass.border }]}>
        <Ionicons
          name={type === 'swipe-left' ? 'arrow-back' : type === 'swipe-right' ? 'arrow-forward' : 'ellipse'}
          size={12}
          color={colors.brand.primary}
        />
        <AppText variant="caption" style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}>
          {labelText}
        </AppText>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  cursorCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
});
