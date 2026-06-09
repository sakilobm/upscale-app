import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@constants/index';

interface ProgressBarProps {
  progress: number;           // 0 – 1
  gradient?: readonly [string, string, ...string[]];
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export const ProgressBar = memo(function ProgressBar({
  progress,
  gradient = Colors.gradients.purpleBlue,
  height = 6,
  style,
  animated = true,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(clampedProgress);
    }
  }, [animated, clampedProgress, widthAnim]);

  const containerStyle: ViewStyle = {
    height,
    borderRadius: Radius.full,
    backgroundColor: Colors.glass.backgroundMid,
    overflow: 'hidden',
  };

  return (
    <View style={[containerStyle, style]}>
      <Animated.View
        style={{
          width: widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
          height: '100%',
          borderRadius: Radius.full,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
});
