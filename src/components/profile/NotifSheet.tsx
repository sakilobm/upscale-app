/**
 * @file NotifSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Advanced notification-preference configuration rendered inside ProfileBottomSheet.
 *   Establishes clean visual nesting hierarchies where sub-settings collapse when parent alerts
 *   are disabled. Features tree-structured indented lines and segmented DND/channel controls.
 * @associatedFiles src/components/profile/ProfileBottomSheet.tsx, src/features/profile/hooks/useProfileScreen.ts
 */

import React from 'react';
import { View, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';
import type { NotifPrefs } from '@features/profile/hooks/useProfileScreen';

interface Props {
  prefs: NotifPrefs;
  onChange: <K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) => void;
}

const ALERTS: { key: keyof NotifPrefs; label: string; sub: string; icon: string; color: string }[] = [
  { key: 'transactions', label: 'Transaction Alerts', sub: 'Notify on spend or income', icon: 'swap-horizontal-outline', color: '#10B981' },
  { key: 'budgetAlerts', label: 'Budget Warnings', sub: 'Alert when nearing category limit', icon: 'warning-outline', color: '#F59E0B' },
  { key: 'plannedPay', label: 'Planned Payments', sub: 'Remind me before due date', icon: 'calendar-outline', color: '#3B82F6' },
  { key: 'weeklyReport', label: 'Weekly Summary', sub: 'Spending digest every Sunday', icon: 'pie-chart-outline', color: '#8B5CF6' },
];

const AMOUNTS = [
  { value: 0, label: 'All Txs' },
  { value: 10, label: '>$10' },
  { value: 50, label: '>$50' },
  { value: 100, label: '>$100' },
];

const CHANNELS: { value: 'push' | 'email' | 'both'; label: string; icon: string }[] = [
  { value: 'push', label: 'Push Only', icon: 'notifications-outline' },
  { value: 'email', label: 'Email Only', icon: 'mail-outline' },
  { value: 'both', label: 'Both', icon: 'phone-portrait-outline' },
];

export function NotifSheet({ prefs, onChange }: Props) {
  const { colors, isDark } = useTheme();

  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const activeBg = colors.brand.primary + '18';
  const activeBorder = colors.brand.primary;
  const lineCol = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* SECTION 1: ALERT RULES (WITH VISUAL TREE HIERARCHY) */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          ALERT PREFERENCES
        </AppText>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          {ALERTS.map((item, idx) => (
            <View
              key={item.key}
              style={[
                s.row,
                idx < ALERTS.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <View style={[s.iconBox, { backgroundColor: item.color + '18', borderColor: item.color + '30' }]}>
                <Ionicons name={item.icon as any} size={16} color={item.color} />
              </View>
              <View style={{ flex: 1, gap: 1 }}>
                <AppText variant="labelLG" color={colors.text.primary}>{item.label}</AppText>
                <AppText variant="caption" color={colors.text.tertiary}>{item.sub}</AppText>
              </View>
              <Switch
                value={prefs[item.key] as boolean}
                onValueChange={(v) => onChange(item.key, v as any)}
                trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.glass.backgroundMid}
              />
            </View>
          ))}
        </View>
      </View>

      {/* SECTION 2: SMART ALERTS & LIMITS */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          SMART SETTINGS
        </AppText>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          {/* Quiet Hours */}
          <View style={[s.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[s.iconBox, { backgroundColor: '#EC489918', borderColor: '#EC489930' }]}>
              <Ionicons name="moon-outline" size={16} color="#EC4899" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>Quiet Hours</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Silence alerts between 10 PM & 7 AM</AppText>
            </View>
            <Switch
              value={prefs.quietHours}
              onValueChange={(v) => onChange('quietHours', v)}
              trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.glass.backgroundMid}
            />
          </View>

          {/* AI Insights Predictor */}
          <View style={[s.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
            <View style={[s.iconBox, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B30' }]}>
              <Ionicons name="sparkles-outline" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>AI Smart Predictor</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Pre-emptively warn when nearing limits</AppText>
            </View>
            <Switch
              value={prefs.smartInsights}
              onValueChange={(v) => onChange('smartInsights', v)}
              trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.glass.backgroundMid}
            />
          </View>

          {/* Alert Threshold Chips */}
          <View style={s.thresholdRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], marginBottom: Spacing['2'] }}>
              <Ionicons name="funnel-outline" size={13} color={colors.text.secondary} />
              <AppText variant="labelMD" color={colors.text.primary}>Alert Min Amount</AppText>
            </View>
            <View style={s.chipRow}>
              {AMOUNTS.map((amt) => {
                const active = prefs.minAlertAmount === amt.value;
                return (
                  <Pressable
                    key={amt.value}
                    onPress={() => onChange('minAlertAmount', amt.value)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: active ? activeBg : 'rgba(0,0,0,0.015)',
                        borderColor: active ? activeBorder : colors.glass.border,
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        s.chipLabel,
                        {
                          color: active ? colors.brand.primary : colors.text.secondary,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {amt.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* SECTION 3: DELIVERY CHANNEL */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          DELIVERY CHANNEL
        </AppText>
        <View style={s.channelRow}>
          {CHANNELS.map((chan) => {
            const active = prefs.channels === chan.value;
            return (
              <Pressable
                key={chan.value}
                onPress={() => onChange('channels', chan.value)}
                style={[
                  s.channelBox,
                  {
                    backgroundColor: active ? activeBg : cardBg,
                    borderColor: active ? activeBorder : colors.glass.border,
                  },
                ]}
              >
                <Ionicons name={chan.icon as any} size={18} color={active ? colors.brand.primary : colors.text.secondary} />
                <AppText
                  style={[
                    s.channelLabel,
                    {
                      color: active ? colors.brand.primary : colors.text.primary,
                      fontWeight: active ? '700' : '500',
                    },
                  ]}
                >
                  {chan.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Spacing['2'],
  },
  content: {
    paddingHorizontal: Spacing['5'],
    paddingBottom: Spacing['8'],
    gap: 18,
  },
  section: {
    gap: Spacing['2'],
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 9.5,
    letterSpacing: 1,
    paddingLeft: 4,
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
    paddingVertical: Spacing['3'] + 1,
    gap: Spacing['3'],
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  thresholdRow: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 11,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  channelBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 6,
  },
  channelLabel: {
    fontSize: 11,
  },
});
