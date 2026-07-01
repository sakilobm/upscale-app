/**
 * @file LoadingOverlay.tsx
 * @architecture Presentation Layer — UI Component
 * @description Premium glassmorphic global loading overlay for data updates, clearing data,
 *   and seeding demo environments. Features fluid loop animations using Reanimated.
 * @associatedFiles src/store/loadingStore.ts, src/app/_layout.tsx
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useLoadingStore } from '@store/loadingStore';
import { Spacing } from '@constants/index';

export const LoadingOverlay = React.memo(() => {
  const { colors, isDark } = useTheme();
  const isVisible = useLoadingStore((s) => s.isVisible);
  const title = useLoadingStore((s) => s.title);
  const subtitle = useLoadingStore((s) => s.subtitle);

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!isVisible) return;

    // Breathing pulse for the inner icon box
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(1.0, { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
      ),
      -1,
      true
    );

    // Glowing ring pulse
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 800 }),
        withTiming(0.25, { duration: 800 })
      ),
      -1,
      true
    );

    // Slow rotation for the outer halo border
    rotation.value = withRepeat(
      withTiming(360, { duration: 3200, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      cancelAnimation(rotation);
    };
  }, [isVisible]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  if (!isVisible) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        {/* Frosted Glass blur backing */}
        <BlurView
          intensity={isDark ? 45 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        {/* Fallback overlay block for styling alignment */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.85)' }
          ]}
        />

        <View style={s.content}>
          {/* Main Visual Animation Container */}
          <View style={s.logoWrapper}>
            {/* Glowing Ring */}
            <Animated.View
              style={[
                s.glowRing,
                glowStyle,
                { borderColor: colors.brand.primary, shadowColor: colors.brand.primary }
              ]}
            />

            {/* Rotating dotted halo border */}
            <Animated.View
              style={[
                s.haloBorder,
                rotateStyle,
                { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }
              ]}
            />

            {/* Pulsing Icon Shield */}
            <Animated.View style={[s.iconBox, logoStyle, { backgroundColor: colors.brand.primary }]}>
              <Ionicons name="cloud-download-outline" size={26} color={colors.white} />
            </Animated.View>
          </View>

          {/* Dynamic state description texts */}
          <View style={s.textGroup}>
            <AppText
              variant="headingSM"
              color={colors.text.primary}
              style={{ fontWeight: '800', textAlign: 'center', letterSpacing: 0.1 }}
            >
              {title}
            </AppText>
            <AppText
              variant="caption"
              color={colors.text.tertiary}
              style={{ textAlign: 'center', fontSize: 13, lineHeight: 18, marginTop: 2 }}
            >
              {subtitle}
            </AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['6'],
  },
  logoWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.85,
  },
  haloBorder: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  textGroup: {
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});
