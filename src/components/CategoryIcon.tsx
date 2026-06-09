import React, { memo } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius } from '@constants/index';
import type { TransactionCategory } from '@store/types';

const CATEGORY_META: Record<
  TransactionCategory,
  { emoji: string; bg: string; color: string }
> = {
  housing:       { emoji: '🏠', bg: Colors.chart.housing + '30', color: Colors.chart.housing },
  food:          { emoji: '🍔', bg: Colors.chart.food + '30',    color: Colors.chart.food },
  transport:     { emoji: '🚗', bg: Colors.chart.transport + '30', color: Colors.chart.transport },
  health:        { emoji: '💊', bg: Colors.chart.health + '30',  color: Colors.chart.health },
  entertainment: { emoji: '🎮', bg: Colors.chart.entertainment + '30', color: Colors.chart.entertainment },
  shopping:      { emoji: '🛍️', bg: Colors.chart.shopping + '30', color: Colors.chart.shopping },
  education:     { emoji: '📚', bg: '#818CF830', color: '#818CF8' },
  savings:       { emoji: '🏦', bg: Colors.brand.primary + '30', color: Colors.brand.primary },
  investment:    { emoji: '📈', bg: '#10B98130', color: '#10B981' },
  salary:        { emoji: '💼', bg: '#34D39930', color: '#34D399' },
  freelance:     { emoji: '💻', bg: '#38BDF830', color: '#38BDF8' },
  gift:          { emoji: '🎁', bg: '#EC489930', color: '#EC4899' },
  other:         { emoji: '📦', bg: Colors.chart.other + '30',   color: Colors.chart.other },
};

interface CategoryIconProps {
  category: TransactionCategory;
  size?: number;
}

export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = 44,
}: CategoryIconProps) {
  const meta = CATEGORY_META[category];

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: Radius.md,
    backgroundColor: meta.bg,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle}>
      <AppText style={{ fontSize: size * 0.45 }}>{meta.emoji}</AppText>
    </View>
  );
});

export { CATEGORY_META };
