/**
 * @file AccountStatCard.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Small metric card shown in the selected-account detail panel.
 *   Displays an icon badge, label, and value with theme-aware background.
 * @associatedFiles src/app/accounts.tsx
 */

import { View, StyleSheet, Platform } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { Radius } from '@constants/Dimensions';
import { useTheme } from '@hooks/useTheme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  value: string;
  icon:  IoniconName;
  color: string;
}

export function AccountStatCard({ label, value, icon, color }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' }]}>
      <View style={[s.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <AppText variant="labelSM" style={{ color: colors.text.tertiary, marginTop: 8 }}>{label}</AppText>
      <AppText variant="labelLG" style={{ color: colors.text.primary, fontWeight: '700', marginTop: 2 }}>{value}</AppText>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1, borderRadius: Radius.lg, padding: 12, alignItems: 'flex-start',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
