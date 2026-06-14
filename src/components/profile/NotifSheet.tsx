/**
 * @file NotifSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Notification-preference toggle list rendered inside ProfileBottomSheet.
 *   All haptic feedback is handled by useProfileScreen.preferences.updateNotification.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx,
 *   src/features/profile/hooks/useProfileScreen.ts
 */

import React from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing } from '@constants/index';
import type { NotifPrefs } from '@features/profile/hooks/useProfileScreen';

interface Props {
  prefs:    NotifPrefs;
  onChange: (key: keyof NotifPrefs, value: boolean) => void;
}

const ITEMS: { key: keyof NotifPrefs; label: string; sub: string }[] = [
  { key: 'transactions', label: 'Transaction Alerts',  sub: 'Notify on every spend or income'    },
  { key: 'budgetAlerts', label: 'Budget Warnings',     sub: 'Alert when nearing category limit'   },
  { key: 'plannedPay',   label: 'Planned Payments',    sub: 'Remind me 2 days before due date'    },
  { key: 'weeklyReport', label: 'Weekly Summary',      sub: 'Spending digest every Sunday'         },
];

export function NotifSheet({ prefs, onChange }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ marginTop: Spacing['3'] }}>
      {ITEMS.map((item, idx) => (
        <View
          key={item.key}
          style={[
            s.row,
            idx < ITEMS.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="labelLG" color={colors.text.primary}>{item.label}</AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{item.sub}</AppText>
          </View>
          <Switch
            value={prefs[item.key]}
            onValueChange={(v) => onChange(item.key, v)}
            trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.glass.backgroundMid}
          />
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'],
  },
});
