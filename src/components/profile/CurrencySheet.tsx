/**
 * @file CurrencySheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Scrollable list of supported currencies rendered inside ProfileBottomSheet.
 *   Highlights the currently active currency; calls onSelect when the user picks one.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx, src/app/(tabs)/profile.tsx
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_SYMBOLS } from '@store/types';
import { Spacing } from '@constants/index';
import type { CurrencyCode } from '@store/types';

const CURRENCIES: { code: CurrencyCode; name: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar',        flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro',             flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound',    flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee',     flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen',     flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar',  flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
];

interface Props {
  current:  CurrencyCode;
  onSelect: (code: CurrencyCode) => void;
}

export function CurrencySheet({ current, onSelect }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing['2'] }}>
      {CURRENCIES.map((c) => {
        const active = c.code === current;
        return (
          <Pressable
            key={c.code}
            onPress={() => onSelect(c.code)}
            style={[
              s.row,
              active && { backgroundColor: colors.brand.primary + (isDark ? '20' : '12') },
            ]}
          >
            <AppText style={s.flag}>{c.flag}</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="labelLG" color={colors.text.primary}>{c.name}</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>{c.code} · {CURRENCY_SYMBOLS[c.code]}</AppText>
            </View>
            {active && <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />}
          </Pressable>
        );
      })}
      <View style={{ height: Spacing['8'] }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'] },
  flag: { fontSize: 24 },
});
