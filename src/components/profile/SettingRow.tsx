/**
 * @file SettingRow.tsx
 * @architecture Presentation Layer — Reusable UI Component
 * @description A single tappable row inside a profile SectionCard. Renders an icon
 *   badge, label, optional subtitle, and a custom right slot (defaults to chevron).
 *   Provides scale-spring feedback on press via Reanimated.
 * @associatedFiles src/components/profile/SectionCard.tsx, src/app/(tabs)/profile.tsx
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  icon:      IoniconName;
  iconColor: string;
  label:     string;
  subtitle?: string;
  onPress?:  () => void;
  right?:    React.ReactNode;
  isLast?:   boolean;
}

export function SettingRow({ icon, iconColor, label, subtitle, onPress, right, isLast }: Props) {
  const { colors, isDark } = useTheme();
  const scale    = useSharedValue(1);
  const rowAnim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        rowAnim,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        },
      ]}
    >
      <Pressable
        onPress={() => { if (onPress) { Haptics.selectionAsync(); onPress(); } }}
        onPressIn={() => { if (onPress) scale.value = withSpring(0.974, { damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18 }); }}
        style={s.row}
      >
        <View style={[s.iconBox, { backgroundColor: iconColor + (isDark ? '28' : '18') }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={s.body}>
          <AppText variant="labelLG" color={colors.text.primary}>{label}</AppText>
          {subtitle && <AppText variant="caption" color={colors.text.tertiary}>{subtitle}</AppText>}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} /> : null)}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['3'],
    paddingVertical: Spacing['4'], paddingHorizontal: Spacing['4'],
  },
  iconBox: {
    width: 38, height: 38, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1, gap: 2 },
});
