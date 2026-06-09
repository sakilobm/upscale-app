import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '@constants/index';
import type { TransactionCategory } from '@store/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_META: Record<
  TransactionCategory,
  { icon: IoniconName; bg: string; color: string }
> = {
  housing:       { icon: 'home-outline', bg: Colors.chart.housing + '18', color: Colors.chart.housing },
  food:          { icon: 'fast-food-outline', bg: Colors.chart.food + '18', color: Colors.chart.food },
  transport:     { icon: 'car-outline', bg: Colors.chart.transport + '18', color: Colors.chart.transport },
  health:        { icon: 'medical-outline', bg: Colors.chart.health + '18', color: Colors.chart.health },
  entertainment: { icon: 'game-controller-outline', bg: Colors.chart.entertainment + '18', color: Colors.chart.entertainment },
  shopping:      { icon: 'bag-handle-outline', bg: Colors.chart.shopping + '18', color: Colors.chart.shopping },
  education:     { icon: 'book-outline', bg: '#818CF818', color: '#818CF8' },
  savings:       { icon: 'wallet-outline', bg: Colors.brand.primary + '18', color: Colors.brand.primary },
  investment:    { icon: 'trending-up-outline', bg: '#10B98118', color: '#10B981' },
  salary:        { icon: 'briefcase-outline', bg: '#34D39918', color: '#34D399' },
  freelance:     { icon: 'laptop-outline', bg: '#38BDF818', color: '#38BDF8' },
  gift:          { icon: 'gift-outline', bg: '#EC489918', color: '#EC4899' },
  other:         { icon: 'cube-outline', bg: Colors.chart.other + '18', color: Colors.chart.other },
};

interface CategoryIconProps {
  category: TransactionCategory;
  size?: number;
}

export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = 44,
}: CategoryIconProps) {
  const meta = CATEGORY_META[category] || {
    icon: 'help-outline' as IoniconName,
    bg: '#94A3B818',
    color: '#94A3B8',
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: Radius.md,
    backgroundColor: meta.bg,
    borderWidth: 1,
    borderColor: meta.color + '2c', // Hex transparency for subtle glass border
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle}>
      <Ionicons name={meta.icon} size={size * 0.5} color={meta.color} />
    </View>
  );
});

export { CATEGORY_META };
export type { IoniconName };

