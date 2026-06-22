/**
 * @file AccountChip.tsx
 * @architecture Presentation Layer — UI Component
 * @description A refined tappable account-filter chip with cleaner proportions, softer
 *   active state, and polished spring-scale animation. Reduced visual noise with
 *   monochromatic tinting and tighter spacing.
 * @associatedFiles src/components/activity/AccountBar.tsx, src/app/(tabs)/transactions.tsx
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius } from '@constants/index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface ChipData {
  id: string | null;
  name: string;
  icon: IoniconName;
  color: string;
  balance: number;
}

interface Props {
  chip: ChipData;
  isActive: boolean;
  onPress: () => void;
}

export function AccountChip({ chip, isActive, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.93, { damping: 14, stiffness: 320 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    });
    onPress();
  };

  const isBrightColor = !isDark && chip.color === colors.brand.primary;
  const displayColor  = isBrightColor ? colors.text.brand : chip.color;

  // Active: vivid tint bg + solid border. Inactive: subtle surface + ghost border.
  const bg      = isActive ? displayColor + '14' : (isDark ? colors.glass.background : colors.background.card);
  const border  = isActive ? displayColor + '40' : (isDark ? colors.glass.border : colors.glass.borderStrong);
  const nameClr = isActive ? displayColor : colors.text.secondary;
  const balClr  = isActive ? displayColor + 'AA' : colors.text.tertiary;
  const iconBg  = isActive ? displayColor + '22' : displayColor + '0E';

  return (
    <Pressable onPress={handlePress} style={s.wrapper}>
      <Animated.View style={[s.chip, animStyle, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
        <View style={[s.icon, { backgroundColor: iconBg }]}>
          <Ionicons name={chip.icon} size={16} color={displayColor} />
        </View>
        <View style={s.labels}>
          <AppText
            variant="labelSM"
            style={{ color: nameClr, fontWeight: isActive ? '700' : '600', lineHeight: 15, fontSize: 12.5 }}
            numberOfLines={1}
          >
            {chip.name}
          </AppText>
          <AppText style={{ color: balClr, fontSize: 10.5, lineHeight: 13, fontWeight: isActive ? '600' : '400' }} numberOfLines={1}>
            {symbol}{chip.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </AppText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: { marginRight: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: Radius.lg, gap: 8,
  },
  icon:   { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  labels: { gap: 1 },
});
