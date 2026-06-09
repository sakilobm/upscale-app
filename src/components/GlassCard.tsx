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
    borderColor: borderGlow ? colors.glass.borderStrong : colors.glass.border,
  };

  const lightShadow: ViewStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    backgroundColor: colors.background.card,
  };

  const darkShadow: ViewStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  };

  const innerStyle: ViewStyle = { padding };

  const content = (
    <View style={[containerStyle, isDark ? darkShadow : lightShadow, StyleSheet.flatten(style)]}>
      {isDark && (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, isDark ? styles.gradientOverlayDark : styles.gradientOverlayLight]}
        />
      ) : isDark ? (
        <View style={[StyleSheet.absoluteFill, styles.solidOverlayDark]} />
      ) : null}
      {isDark && <View style={[styles.shine, { borderRadius }]} />}
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
  solidOverlayDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});
