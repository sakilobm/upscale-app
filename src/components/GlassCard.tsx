import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  Pressable,
  type PressableProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Spacing } from '@constants/index';
import { BlurConfigs, type BlurConfigKey } from '@constants/BlurConfigs';
import { useTheme } from '@hooks/useTheme';

interface GlassCardProps extends Pick<PressableProps, 'onPress' | 'onLongPress'> {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  blurConfig?: BlurConfigKey;
  borderGlow?: boolean;
  gradient?: readonly [string, string, ...string[]];
  padding?: number;
  borderRadius?: number;
  disabled?: boolean;
}

const CONSTANTS = {
  defaultPadding: Spacing['5'],
  defaultRadius: Radius.xl,
} as const;

export const GlassCard = memo(function GlassCard({
  children,
  style,
  blurConfig = 'card',
  borderGlow = false,
  gradient,
  padding = CONSTANTS.defaultPadding,
  borderRadius = CONSTANTS.defaultRadius,
  onPress,
  onLongPress,
  disabled = false,
}: GlassCardProps) {
  const { isDark, colors } = useTheme();
  const { intensity } = BlurConfigs[blurConfig];

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: borderGlow
      ? (isDark ? 'rgba(108, 99, 255, 0.35)' : 'rgba(108, 99, 255, 0.25)')
      : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)'),
  };

  const lightShadow: ViewStyle = {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.50)', // Translucent frosted light glass
  };

  const darkShadow: ViewStyle = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
    backgroundColor: 'rgba(13, 18, 32, 0.40)', // Translucent frosted dark glass
  };

  const innerStyle: ViewStyle = { padding };

  const content = (
    <View style={[containerStyle, isDark ? darkShadow : lightShadow, StyleSheet.flatten(style)]}>
      {/* Real-time blur layer for iOS */}
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass gradient overlay to simulate light refraction */}
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, isDark ? styles.gradientOverlayDark : styles.gradientOverlayLight]}
        />
      ) : (
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.015)']
              : ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.20)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Top light reflection border highlight */}
      <View
        style={[
          styles.shine,
          {
            borderRadius,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      />
      <View style={innerStyle}>{children}</View>
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
});

const styles = StyleSheet.create({
  gradientOverlayDark: {
    opacity: 0.15,
  },
  gradientOverlayLight: {
    opacity: 0.12,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
