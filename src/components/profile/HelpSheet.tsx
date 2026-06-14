/**
 * @file HelpSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Accordion FAQ list rendered inside ProfileBottomSheet.
 *   Manages its own open/closed state for FAQ items (pure display state).
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import { Spacing, Radius } from '@constants/index';

const FAQ_ITEMS = [
  { q: 'How do I add a transaction?',     a: 'Tap the + button on the Home or Activity tab to log income or expenses.' },
  { q: 'How do budgets work?',            a: 'Set a monthly limit per category in the Budget tab. We track spending and warn you when nearing the limit.' },
  { q: 'Can I export my data?',           a: 'Yes — go to Profile → Export Data to share your transactions as CSV.' },
  { q: 'How do I track who owes me?',     a: 'Use the Ledger tab to record hand-to-hand money exchanges and loans.' },
  { q: 'Is my data secure?',             a: 'All data is encrypted at rest and in transit. We never share your data.' },
];

export function HelpSheet() {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing['2'] }}>
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <Pressable
            key={idx}
            onPress={() => { Haptics.selectionAsync(); setOpen(isOpen ? null : idx); }}
            style={[
              s.item,
              idx < FAQ_ITEMS.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            <View style={s.row}>
              <AppText variant="labelMD" color={colors.text.primary} style={{ flex: 1, fontWeight: '600' }}>
                {item.q}
              </AppText>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={colors.text.tertiary} />
            </View>
            {isOpen && (
              <AppText variant="bodySM" color={colors.text.secondary} style={s.answer}>
                {item.a}
              </AppText>
            )}
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => toast.info('Email us at support@wherecash.app')}
        style={[s.contact, { backgroundColor: colors.brand.primary + '14' }]}
      >
        <Ionicons name="mail-outline" size={16} color={colors.brand.primary} />
        <AppText variant="labelMD" style={{ color: colors.brand.accent }}>Contact Support</AppText>
      </Pressable>

      <View style={{ height: Spacing['8'] }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  item:    { paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['2'] },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing['2'] },
  answer:  { lineHeight: 20, opacity: 0.85 },
  contact: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'],
    marginHorizontal: Spacing['5'], marginTop: Spacing['4'],
    paddingVertical: Spacing['3'], borderRadius: Radius.lg,
  },
});
