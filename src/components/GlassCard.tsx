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
import { Colors, Radius, Shadow, Spacing } from '@constants/index';
import { BlurConfigs, type BlurConfigKey } from '@constants/BlurConfigs';

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
  shimmerHeight: 1,
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
  const { intensity, tint } = BlurConfigs[blurConfig];

  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: borderGlow
      ? Colors.glass.borderStrong
      : Colors.glass.border,
  };

  const innerStyle: ViewStyle = {
    padding,
  };

  const content = (
    <View style={[containerStyle, Shadow.md, StyleSheet.flatten(style)]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      {gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.gradientOverlay]}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.solidOverlay]} />
      )}
      {/* Top shine shimmer */}
      <View style={[styles.shine, { borderRadius }]} />
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
  gradientOverlay: {
    opacity: 0.15,
  },
  solidOverlay: {
    backgroundColor: Colors.glass.background,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.glass.shine,
  },
});
