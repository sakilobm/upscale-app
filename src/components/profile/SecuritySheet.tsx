/**
 * @file SecuritySheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Security-preference toggle list rendered inside ProfileBottomSheet.
 *   All haptic feedback is handled by useProfileScreen.preferences.updateSecurity.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx,
 *   src/features/profile/hooks/useProfileScreen.ts
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import { Spacing, Radius } from '@constants/index';
import type { SecPrefs } from '@features/profile/hooks/useProfileScreen';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  prefs:    SecPrefs;
  onChange: (key: keyof SecPrefs, value: boolean) => void;
}

const ITEMS: { key: keyof SecPrefs; label: string; sub: string; icon: IoniconName; colorKey: 'savings' | 'expense' | 'warning' }[] = [
  { key: 'biometric',   label: 'Face ID / Touch ID', sub: 'Use biometrics to unlock app',        icon: 'finger-print',   colorKey: 'savings' },
  { key: 'autoLock',    label: 'Auto-Lock',           sub: 'Lock after 5 min of inactivity',      icon: 'lock-closed',    colorKey: 'expense' },
  { key: 'hideBalance', label: 'Hide Balance',        sub: 'Blur amounts on home screen',         icon: 'eye-off',        colorKey: 'warning' },
];

export function SecuritySheet({ prefs, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ marginTop: Spacing['3'] }}>
      {ITEMS.map((item, idx) => {
        const itemColor = colors.status[item.colorKey];
        return (
          <View
            key={item.key}
            style={[
              s.row,
              idx < ITEMS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.glass.background,
              },
            ]}
          >
            <View style={[s.icon, { backgroundColor: itemColor + '18' }]}>
              <Ionicons name={item.icon} size={16} color={itemColor} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="labelLG" color={colors.text.primary}>{item.label}</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>{item.sub}</AppText>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(v) => onChange(item.key, v)}
              trackColor={{ false: colors.glass.backgroundMid, true: itemColor }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.glass.backgroundMid}
            />
          </View>
        );
      })}

      <Pressable
        onPress={() => toast.info('PIN setup coming in the next update')}
        style={[s.pinBtn, { borderColor: colors.glass.border }]}
      >
        <Ionicons name="keypad-outline" size={16} color={colors.text.secondary} />
        <AppText variant="labelMD" color={colors.text.secondary}>Change PIN</AppText>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'],
  },
  icon:   { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'],
    marginHorizontal: Spacing['5'], marginTop: Spacing['3'],
    paddingVertical: Spacing['3'],
    borderRadius: Radius.lg, borderWidth: 1,
  },
});
