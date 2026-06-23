/**
 * @file HapticSettingsSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Bottom sheet component to configure advanced haptic feedback options:
 *   intensity level (Off, Soft, Light, Medium, Heavy) and granular trigger contexts
 *   (onboarding, taps, actions).
 */

import React from 'react';
import { ScrollView, View, StyleSheet, Switch, Pressable } from 'react-native';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';
import { usePreferencesStore, type HapticLevel } from '@store/preferencesStore';
import { triggerAppHaptic } from '@/services/hapticsService';
import { Ionicons } from '@expo/vector-icons';
import { toast } from '@store/toastStore';

const LEVELS: { key: HapticLevel; label: string; desc: string; icon: string }[] = [
  { key: 'off',    label: 'Off',     desc: 'Disable all vibration feedback',        icon: 'volume-mute-outline' },
  { key: 'soft',   label: 'Soft',    desc: 'Very gentle, subtle micro-haptics',    icon: 'leaf-outline' },
  { key: 'light',  label: 'Light',   desc: 'Clean, crisp tactile feedback',        icon: 'flash-outline' },
  { key: 'medium', label: 'Medium',  desc: 'Balanced standard responses',          icon: 'finger-print-outline' },
  { key: 'heavy',  label: 'Heavy',   desc: 'Firm, strong impact vibration',         icon: 'hammer-outline' },
];

const TOGGLES = [
  { key: 'hapticsEnabledButtonTaps', label: 'Button & Tab Taps',   sub: 'Vibrate gently when clicking items or switching tabs', context: 'button' as const },
  { key: 'hapticsEnabledActions',    label: 'Actions & Operations', sub: 'Tactile alerts on transaction entries and swipe deletes', context: 'action' as const },
  { key: 'hapticsEnabledOnboarding', label: 'Onboarding Carousel',  sub: 'Vibrate during tutorial slides and initial setup gestures', context: 'onboarding' as const },
];

export function HapticSettingsSheet() {
  const { colors, isDark } = useTheme();
  
  const hapticLevel = usePreferencesStore((s) => s.hapticLevel);
  const setHapticLevel = usePreferencesStore((s) => s.setHapticLevel);
  
  const onboarding = usePreferencesStore((s) => s.hapticsEnabledOnboarding);
  const setOnboarding = usePreferencesStore((s) => s.setHapticsEnabledOnboarding);
  
  const taps = usePreferencesStore((s) => s.hapticsEnabledButtonTaps);
  const setTaps = usePreferencesStore((s) => s.setHapticsEnabledButtonTaps);
  
  const actions = usePreferencesStore((s) => s.hapticsEnabledActions);
  const setActions = usePreferencesStore((s) => s.setHapticsEnabledActions);

  const handleSelectLevel = async (level: HapticLevel) => {
    setHapticLevel(level);
    const label = LEVELS.find((l) => l.key === level)?.label ?? level;
    toast.success(`Haptic feedback set to ${label}`);
    
    // Trigger a sample vibration immediately so the user can test the level strength
    if (level !== 'off') {
      // Temporarily set level in memory state to play feedback
      setTimeout(() => {
        triggerAppHaptic(level === 'soft' ? 'selection' : 'medium', 'action');
      }, 50);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    let label = '';
    if (key === 'hapticsEnabledButtonTaps') {
      setTaps(value);
      label = 'Button & Tab Taps';
    } else if (key === 'hapticsEnabledActions') {
      setActions(value);
      label = 'Actions & Operations';
    } else if (key === 'hapticsEnabledOnboarding') {
      setOnboarding(value);
      label = 'Onboarding Carousel';
    }
    toast.success(`${label} haptics ${value ? 'enabled' : 'disabled'}`);
    triggerAppHaptic('selection', 'button');
  };

  const currentPrefs = {
    hapticsEnabledButtonTaps: taps,
    hapticsEnabledActions: actions,
    hapticsEnabledOnboarding: onboarding,
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <AppText variant="labelMD" color={colors.text.secondary} style={s.sectionTitle}>
        VIBRATION STRENGTH
      </AppText>
      
      {/* ── Strength Options List ── */}
      <View style={[s.card, { backgroundColor: isDark ? colors.background.secondary : colors.background.card, borderColor: isDark ? colors.glass.border : colors.glass.borderStrong }]}>
        {LEVELS.map((level, idx) => {
          const isSelected = hapticLevel === level.key;
          return (
            <Pressable
              key={level.key}
              onPress={() => handleSelectLevel(level.key)}
              style={({ pressed }) => [
                s.row,
                idx < LEVELS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
                { opacity: pressed ? 0.75 : 1 }
              ]}
            >
              <View style={[s.iconWrap, { backgroundColor: isSelected ? colors.brand.primary + '18' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') }]}>
                <Ionicons name={level.icon as any} size={15} color={isSelected ? colors.brand.primary : colors.text.tertiary} />
              </View>
              <View style={s.textContainer}>
                <AppText variant="labelMD" color={isSelected ? colors.brand.primary : colors.text.primary} style={{ fontWeight: '600' }}>
                  {level.label}
                </AppText>
                <AppText variant="caption" color={colors.text.tertiary}>
                  {level.desc}
                </AppText>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-sharp" size={17} color={colors.brand.primary} />
              )}
            </Pressable>
          );
        })}
      </View>

      <AppText variant="labelMD" color={colors.text.secondary} style={[s.sectionTitle, { marginTop: Spacing['4'] }]}>
        GRANULAR TRIGGERS
      </AppText>

      {/* ── Context Toggles List ── */}
      <View style={[s.card, { backgroundColor: isDark ? colors.background.secondary : colors.background.card, borderColor: isDark ? colors.glass.border : colors.glass.borderStrong }]}>
        {TOGGLES.map((t, idx) => {
          const value = currentPrefs[t.key as keyof typeof currentPrefs];
          return (
            <View
              key={t.key}
              style={[
                s.row,
                idx < TOGGLES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
              ]}
            >
              <View style={s.textContainer}>
                <AppText variant="labelMD" color={colors.text.primary} style={{ fontWeight: '600' }}>
                  {t.label}
                </AppText>
                <AppText variant="caption" color={colors.text.tertiary}>
                  {t.sub}
                </AppText>
              </View>
              <Switch
                value={value}
                onValueChange={(v) => handleToggle(t.key, v)}
                trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.glass.backgroundMid}
                disabled={hapticLevel === 'off'}
              />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
    paddingBottom: Spacing['8'],
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing['2'],
    paddingLeft: Spacing['1'],
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: 12,
    gap: Spacing['3'],
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 1,
  },
});
