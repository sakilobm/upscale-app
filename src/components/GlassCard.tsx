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
  children:     React.ReactNode;
  style?:       ViewStyle | ViewStyle[];
  blurConfig?:  BlurConfigKey;
  borderGlow?:  boolean;
  gradient?:    readonly [string, string, ...string[]];
  padding?:     number;
  borderRadius?: number;
  disabled?:    boolean;
}

const CONSTANTS = {
  defaultPadding: Spacing['5'],
  defaultRadius:  Radius.xl,
} as const;

export const GlassCard = memo(function GlassCard({
  children,
  style,
  blurConfig    = 'card',
  borderGlow    = false,
  gradient,
  padding       = CONSTANTS.defaultPadding,
  borderRadius  = CONSTANTS.defaultRadius,
  onPress,
  onLongPress,
  disabled      = false,
}: GlassCardProps) {
  const { isDark, colors } = useTheme();
  const { intensity } = BlurConfigs[blurConfig];

  // ─── LIGHT MODE — crisp white card ───────────────────────────────────────
  if (!isDark) {
    const borderColor = borderGlow
      ? colors.brand.primary + '60'
      : 'rgba(0, 0, 0, 0.06)';

    const shadowStyle: ViewStyle = {
      shadowColor:  colors.text.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 14,
      elevation:    3,
    };

    const containerStyle: ViewStyle = {
      backgroundColor: colors.surface.sheet,
      borderRadius,
      borderWidth: 1,
      borderColor,
      overflow: 'hidden',
      ...shadowStyle,
    };

    const inner = (
      <View style={[containerStyle, StyleSheet.flatten(style)]}>
        {/* Subtle top-to-bottom depth gradient */}
        <LinearGradient
          colors={gradient ?? [colors.surface.sheet, colors.background.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Inner content */}
        <View style={{ padding }}>{children}</View>
      </View>
    );

    if (onPress || onLongPress) {
      return (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled}
          style={({ pressed }) => [{ opacity: pressed ? 0.82 : 1 }]}
        >
          {inner}
        </Pressable>
      );
    }
    return inner;
  }

  // ─── DARK MODE — frosted glassmorphism ────────────────────────────────────
  const containerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: borderGlow ? colors.brand.primary + '59' : colors.glass.border,
    shadowColor:  colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation:    6,
    backgroundColor: colors.background.secondary + '66',
  };

  const darkContent = (
    <View style={[containerStyle, StyleSheet.flatten(style)]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradient ?? [colors.glass.background, colors.glass.shine]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Top-edge shine */}
      <View
        style={[
          styles.shine,
          {
            borderRadius,
            backgroundColor: colors.glass.borderStrong,
          },
        ]}
      />
      <View style={{ padding }}>{children}</View>
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
        {darkContent}
      </Pressable>
    );
  }

  return darkContent;
});

const styles = StyleSheet.create({
  shine: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   1,
  },
});
