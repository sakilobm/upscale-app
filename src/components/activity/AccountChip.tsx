/**
 * @file AccountChip.tsx
 * @architecture Presentation Layer — UI Component
 * @description A single tappable account-filter chip in the Activity screen's horizontal
 *   account bar. Uses a spring scale animation on press for tactile feedback.
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
    scale.value = withSpring(0.94, { damping: 14, stiffness: 320 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    });
    onPress();
  };

  const isBrightColor = !isDark && chip.color === colors.brand.primary;
  const displayColor = isBrightColor ? colors.text.brand : chip.color;

  const bg = isActive ? displayColor + '1E' : colors.glass.background;
  const border = isActive ? displayColor + '55' : 'transparent';
  const nameClr = isActive ? displayColor : colors.text.secondary;
  const balClr = isActive ? displayColor + 'BB' : colors.text.secondary;

  return (
    <Pressable onPress={handlePress} style={s.wrapper}>
      <Animated.View style={[s.chip, animStyle, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
        <View style={[s.icon, { backgroundColor: displayColor + (isActive ? '28' : '14') }]}>
          <Ionicons name={chip.icon} size={17} color={displayColor} />
        </View>
        <View style={s.labels}>
          <AppText variant="labelSM" style={{ color: nameClr, fontWeight: isActive ? '700' : '500', lineHeight: 15 }} numberOfLines={1}>
            {chip.name}
          </AppText>
          <AppText style={{ color: balClr, fontSize: 11, lineHeight: 14 }} numberOfLines={1}>
            {symbol}{chip.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </AppText>
        </View>
        {isActive && <View style={[s.activeLine, { backgroundColor: displayColor }]} />}
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrapper: { marginRight: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radius.xl, gap: 8 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  labels: { gap: 1 },
  activeLine: { position: 'absolute', bottom: 0, left: 10, right: 10, height: 2, borderRadius: 1 },
});
