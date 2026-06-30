/**
 * @file TutorialLoader.tsx
 * @architecture Presentation Layer — UI Component
 * @description Frosted glassmorphic transition loading overlay during guide setup.
 *   Uses smooth Reanimated loops to mask navigation changes and store data populations.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { Spacing } from '@constants/index';

interface TutorialLoaderProps {
  colors: any;
  isDark: boolean;
}

export const TutorialLoader = React.memo(({ colors, isDark }: TutorialLoaderProps) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const [status, setStatus] = React.useState({
    title: 'Preparing Walkthrough...',
    subtitle: 'Initializing sandbox container...',
  });

  useEffect(() => {
    // Pulse animation for the loader elements
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900 }),
        withTiming(1.0, { duration: 900 })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 900 }),
        withTiming(0.2, { duration: 900 })
      ),
      -1,
      true
    );

    // Status cycle timeouts
    const t1 = setTimeout(() => {
      setStatus({
        title: 'Adding Mock Data...',
        subtitle: 'Populating playground accounts...',
      });
    }, 280);

    const t2 = setTimeout(() => {
      setStatus({
        title: 'Loading Sandbox...',
        subtitle: 'Configuring interactive guide elements...',
      });
    }, 550);

    const t3 = setTimeout(() => {
      setStatus({
        title: 'Almost Ready...',
        subtitle: 'Activating spotlight overlay...',
      });
    }, 850);

    return () => {
      cancelAnimation(scale);
      cancelAnimation(glowOpacity);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Modal transparent visible animationType="fade">
      <View style={s.overlay}>
        {/* FROSTED GLASS BACKGROUND */}
        <BlurView 
          intensity={isDark ? 45 : 70} 
          tint={isDark ? 'dark' : 'light'} 
          style={StyleSheet.absoluteFill} 
        />
        
        {/* Solid fallbacks for Android/older screens */}
        <View 
          style={[
            StyleSheet.absoluteFill, 
            { backgroundColor: isDark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.85)' }
          ]} 
        />

        <View style={s.content}>
          {/* LOGO & PULSING CIRCLE */}
          <View style={s.logoWrapper}>
            {/* Glowing Ring */}
            <Animated.View 
              style={[
                s.glowRing, 
                glowStyle,
                { borderColor: colors.brand.primary, shadowColor: colors.brand.primary }
              ]} 
            />
            {/* Main Icon */}
            <Animated.View style={[s.iconBox, logoStyle, { backgroundColor: colors.brand.primary }]}>
              <Ionicons name="sparkles" size={28} color={colors.white} />
            </Animated.View>
          </View>

          {/* TRANSITION TEXTS */}
          <View style={s.textGroup}>
            <AppText 
              variant="headingSM" 
              color={colors.text.primary} 
              style={{ fontWeight: '800', textAlign: 'center' }}
            >
              {status.title}
            </AppText>
            <AppText 
              variant="caption" 
              color={colors.text.tertiary} 
              style={{ textAlign: 'center', fontSize: 12, lineHeight: 18 }}
            >
              {status.subtitle}
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
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    shadowOpacity: 0.8,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  textGroup: {
    gap: 4,
    alignItems: 'center',
  },
});
