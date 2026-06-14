/**
 * @file SectionTitle.tsx
 * @architecture Presentation Layer — Reusable UI Component
 * @description Section heading row with an optional "See all" action link.
 *   Used by the Home screen between content sections.
 * @associatedFiles src/app/(tabs)/index.tsx
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing } from '@constants/index';

interface Props {
  title:    string;
  action?:  string;
  onAction?: () => void;
}

export function SectionTitle({ title, action, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.row}>
      <AppText variant="headingSM" color={colors.text.primary}>{title}</AppText>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <AppText variant="labelMD" color={colors.brand.accent}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing['3'],
  },
});
