import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Color by utilization ─────────────────────────────────────────────────────
function utilizationColor(pct: number, colors: any): string {
  if (pct >= 0.85) return colors.status.expense;     // crimson
  if (pct >= 0.50) return '#F59E0B';                 // amber
  return colors.status.income;                        // emerald
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProgressRingProps {
  /** 0–1 */
  progress:     number;
  size?:        number;
  strokeWidth?: number;
  label?:       string;
  sublabel?:    string;
  /** override auto color-by-utilization */
  color?:       string;
  animated?:    boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgressRing({
  progress,
  size        = 80,
  strokeWidth = 7,
  label,
  sublabel,
  color,
  animated    = true,
}: ProgressRingProps) {
  const { colors } = useTheme();

  const radius      = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct  = Math.min(Math.max(progress, 0), 1);

  const ringColor = color ?? utilizationColor(clampedPct, colors);

  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = animated
      ? withTiming(clampedPct, { duration: 900, easing: Easing.out(Easing.cubic) })
      : clampedPct;
  }, [clampedPct, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.glass.backgroundMid}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Center label */}
      {(label || sublabel) && (
        <View style={styles.labelContainer}>
          {label && (
            <AppText
              variant="labelMD"
              style={[styles.label, { color: ringColor, fontSize: size < 70 ? 11 : 13 }]}
            >
              {label}
            </AppText>
          )}
          {sublabel && (
            <AppText
              variant="caption"
              style={[styles.sublabel, { color: colors.text.tertiary, fontSize: size < 70 ? 9 : 10 }]}
            >
              {sublabel}
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight:  '700',
    lineHeight:  16,
    letterSpacing: -0.3,
  },
  sublabel: {
    lineHeight: 12,
    letterSpacing: 0.2,
  },
});
