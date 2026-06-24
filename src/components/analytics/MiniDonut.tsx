/**
 * @file MiniDonut.tsx
 * @architecture Presentation Layer — UI Component
 * @description Circular categorization donut breakdown chart using stacked border rotation layers.
 */

import React from 'react';
import { View } from 'react-native';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import type { CategorySlice } from '@features/analytics/hooks/useAnalyticsScreen';

interface Props {
  /** Array of category slices data */
  slices: CategorySlice[];
  /** Diameter size of the donut ring */
  size: number;
}

export function MiniDonut({ slices, size }: Props) {
  const { colors } = useTheme();
  const strokeWidth = 10;

  // Build rotation offsets
  let accumulated = 0;
  const segments = slices.map((sl) => {
    const rotation = (accumulated / 100) * 360 - 90;
    accumulated += sl.percentage;
    return { ...sl, rotation };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.glass.backgroundMid,
          position: 'absolute',
        }}
      />
      {/* Overlay colored arcs */}
      {segments.slice(0, 4).map((seg) => (
        <View
          key={seg.id}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: seg.color,
            borderRightColor: seg.percentage > 25 ? seg.color : 'transparent',
            transform: [{ rotate: `${seg.rotation}deg` }],
          }}
        />
      ))}
      {/* Center label */}
      <View style={{ alignItems: 'center', justifyContent: 'center', position: 'absolute' }}>
        <AppText style={{ fontSize: 14, fontWeight: '800', color: colors.text.primary }}>
          {slices.length}
        </AppText>
        <AppText style={{ fontSize: 8, fontWeight: '600', color: colors.text.tertiary }}>
          categories
        </AppText>
      </View>
    </View>
  );
}
