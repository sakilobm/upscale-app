/**
 * @file InteractiveGuidesSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Interactive screen tour hub rendered inside ProfileBottomSheet.
 *   Consumes the useInteractiveGuides custom hook to start, preview, and reset tours.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx, src/features/tutorial/hooks/useInteractiveGuides.ts
 */

import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useInteractiveGuides } from '@features/tutorial/hooks/useInteractiveGuides';
import { TOUR_DEFINITIONS } from '@features/tutorial/store/tutorialStore';
import { Spacing, Radius } from '@constants/index';

interface Props {
  onClose?: () => void;
}

export function InteractiveGuidesSheet({ onClose }: Props) {
  const {
    colors,
    isDark,
    completedTours,
    toursList,
    handleLaunchTour,
    handleReset,
  } = useInteractiveGuides(onClose);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <AppText variant="bodySM" color={colors.text.secondary} style={{ lineHeight: 20 }}>
          Master every feature in WhereCash. Tap any interactive visual guide below to replay screen walkthroughs anytime.
        </AppText>

        <View style={s.list}>
          {toursList.map((t) => {
            const def = TOUR_DEFINITIONS[t.id];
            const isDone = completedTours?.[t.id] ?? false;
            return (
              <Pressable
                key={t.id}
                onPress={() => handleLaunchTour(t.id, t.route)}
                style={[
                  s.card,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <View style={[s.iconBox, { backgroundColor: colors.brand.primary + '1A' }]}>
                  <Ionicons name={def.icon as any} size={20} color={colors.brand.primary} />
                </View>

                <View style={s.info}>
                  <AppText variant="labelLG" color={colors.text.primary} style={{ fontWeight: '700' }}>
                    {def.name}
                  </AppText>
                  <AppText variant="caption" color={colors.text.tertiary}>
                    {def.steps.length} interactive step{def.steps.length > 1 ? 's' : ''}
                  </AppText>
                </View>

                <View style={s.rightCol}>
                  <View
                    style={[
                      s.statusBadge,
                      { backgroundColor: isDone ? colors.status.income + '18' : colors.brand.primary + '18' },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: isDone ? colors.status.income : colors.brand.primary,
                        fontSize: 10,
                        fontWeight: '800',
                      }}
                    >
                      {isDone ? 'REPLAY' : 'START'}
                    </AppText>
                  </View>
                  <Ionicons name="play-circle-outline" size={20} color={colors.brand.primary} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Reset all guides button */}
        <Pressable onPress={handleReset} style={s.resetBtn}>
          <Ionicons name="refresh-outline" size={15} color={colors.text.tertiary} />
          <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>
            Reset All Completed Tutorials
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
    paddingBottom: Spacing['8'],
    gap: Spacing['4'],
  },
  list: {
    gap: Spacing['3'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing['3'],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: Spacing['2'],
  },
});
