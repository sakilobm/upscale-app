import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius } from '@constants/Dimensions';

interface Segment {
  key:   string;
  label: string;
}

interface SegmentedControlProps {
  segments:       Segment[];
  activeKey:      string;
  onChange:       (key: string) => void;
  containerWidth?: number;
}

export function SegmentedControl({
  segments,
  activeKey,
  onChange,
  containerWidth,
}: SegmentedControlProps) {
  const { colors, isDark } = useTheme();
  const screenWidth = containerWidth ?? Dimensions.get('window').width - 40;
  const segWidth    = screenWidth / segments.length;
  const activeIndex = segments.findIndex((s) => s.key === activeKey);

  const indicatorX = useSharedValue(activeIndex * segWidth);

  useEffect(() => {
    indicatorX.value = withSpring(activeIndex * segWidth, {
      damping: 22,
      stiffness: 220,
      mass: 0.7,
    });
  }, [activeIndex, segWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          width:           screenWidth,
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderColor:     colors.glass.border,
        },
      ]}
    >
      {/* Sliding pill */}
      <Animated.View
        style={[
          styles.indicator,
          indicatorStyle,
          {
            width:           segWidth - 6,
            backgroundColor: isDark ? colors.brand.primary + '28' : '#FFFFFF',
            borderColor:     isDark ? colors.brand.primary + '50' : 'rgba(0,0,0,0.08)',
            shadowColor:     isDark ? colors.brand.primary : '#000',
            shadowOpacity:   isDark ? 0.3 : 0.1,
          },
        ]}
      />

      {segments.map((seg) => {
        const isActive = seg.key === activeKey;
        return (
          <Pressable
            key={seg.key}
            onPress={() => onChange(seg.key)}
            style={[styles.segment, { width: segWidth }]}
            android_ripple={{ color: 'transparent' }}
          >
            <AppText
              variant="labelMD"
              style={[
                styles.label,
                {
                  color: isActive
                    ? isDark ? colors.brand.secondary : colors.text.primary
                    : colors.text.tertiary,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {seg.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height:       46,
    borderRadius: Radius.xl,
    borderWidth:  1,
    flexDirection: 'row',
    alignItems:   'center',
    overflow:     'hidden',
    position:     'relative',
  },
  indicator: {
    position:     'absolute',
    top:          3,
    bottom:       3,
    left:         3,
    borderRadius: Radius.lg,
    borderWidth:  1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation:    3,
  },
  segment: {
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
    zIndex:         1,
  },
  label: {
    fontSize:    13,
    letterSpacing: 0.2,
  },
});
