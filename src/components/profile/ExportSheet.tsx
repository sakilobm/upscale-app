/**
 * @file ExportSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Export-format picker (CSV / JSON) rendered inside ProfileBottomSheet.
 *   Haptic feedback fires on press; delegate closes the sheet before calling exportData.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx,
 *   src/features/profile/hooks/useProfileScreen.ts
 */

import React, { type ComponentProps } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  onExport: (fmt: 'CSV' | 'JSON') => void;
}

const OPTS: { fmt: 'CSV' | 'JSON'; icon: IoniconName; desc: string }[] = [
  { fmt: 'CSV',  icon: 'document-text-outline', desc: 'Spreadsheet-compatible format' },
  { fmt: 'JSON', icon: 'code-slash-outline',     desc: 'Raw data for developers'       },
];

export function ExportSheet({ onExport }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={s.root}>
      <AppText variant="bodySM" color={colors.text.secondary}>
        Export all your transactions, budgets and planned payments.
      </AppText>
      {OPTS.map((o) => (
        <Pressable
          key={o.fmt}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onExport(o.fmt); }}
          style={[
            s.opt,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
            },
          ]}
        >
          <View style={[s.icon, { backgroundColor: colors.brand.primary + '18' }]}>
            <Ionicons name={o.icon} size={20} color={colors.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="labelLG" color={colors.text.primary}>Export as {o.fmt}</AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{o.desc}</AppText>
          </View>
          <Ionicons name="share-outline" size={18} color={colors.text.tertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: { marginTop: Spacing['4'], gap: Spacing['3'], paddingHorizontal: Spacing['5'] },
  opt:  { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], padding: Spacing['4'], borderRadius: Radius.lg, borderWidth: 1 },
  icon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
