/**
 * @file profile.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Profile screen. Pure declarative orchestrator: reads a single contract
 *   from useProfileScreen and renders extracted components. Zero business logic,
 *   zero raw useState, zero store imports.
 * @associatedFiles src/features/profile/hooks/useProfileScreen.ts,
 *   src/components/profile/ (all components)
 */

import React from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { useProfileScreen } from '@features/profile/hooks/useProfileScreen';
import { ProfileHero } from '@components/profile/ProfileHero';
import { SectionCard } from '@components/profile/SectionCard';
import { SettingRow } from '@components/profile/SettingRow';
import { ProfileBottomSheet } from '@components/profile/ProfileBottomSheet';
import { CurrencySheet } from '@components/profile/CurrencySheet';
import { NotifSheet } from '@components/profile/NotifSheet';
import { SecuritySheet } from '@components/profile/SecuritySheet';
import { ExportSheet } from '@components/profile/ExportSheet';
import { HelpSheet } from '@components/profile/HelpSheet';
import { ConfirmModal } from '@components/ConfirmModal';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import { CURRENCY_SYMBOLS } from '@store/types';
import { Spacing, Radius, Layout } from '@constants/index';

function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const ty      = useSharedValue(18);
  React.useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 360 }));
    ty.value      = withDelay(delay, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: ty.value }] }));
}

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const screen = useProfileScreen();
  const { data, sheets, confirms, preferences, handlers } = screen;

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHero
          initials={data.initials}
          fullName={data.user?.fullName ?? 'Guest'}
          email={data.user?.email ?? ''}
          memberSince={data.memberSince}
          txCount={data.txCount}
          currency={data.user?.currency ?? 'USD'}
          onEditPress={handlers.editName}
        />

        <SectionCard title="Appearance" delay={80}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconColor={isDark ? '#A78BFA' : '#F59E0B'}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            subtitle={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            isLast
            right={
              <Switch
                value={isDark}
                onValueChange={() => { Haptics.selectionAsync(); toggle(); }}
                trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.glass.backgroundMid}
              />
            }
          />
        </SectionCard>

        <SectionCard title="Account" delay={160}>
          <SettingRow icon="wallet-outline"      iconColor="#6C63FF" label="Manage Accounts"   subtitle="Add, edit, or delete accounts"                onPress={() => router.push('/accounts')} />
          <SettingRow icon="grid-outline"        iconColor="#10B981" label="Manage Categories" subtitle="Create & customize spending categories"        onPress={() => router.push('/categories')} />
          <SettingRow
            icon="notifications-outline" iconColor="#F97316" label="Notifications"
            subtitle={`${Object.values(preferences.notifications).filter(Boolean).length} of 4 enabled`}
            onPress={sheets.notifications.open}
          />
          <SettingRow
            icon="globe-outline" iconColor="#3B82F6" label="Currency & Region"
            subtitle={`${data.user?.currency ?? 'USD'} · ${CURRENCY_SYMBOLS[data.user?.currency ?? 'USD']}`}
            onPress={sheets.currency.open}
          />
          <SettingRow
            icon="shield-checkmark-outline" iconColor="#EF4444" label="Security & Privacy"
            subtitle={preferences.security.biometric ? 'Biometrics on' : 'PIN only'}
            onPress={sheets.security.open}
            isLast
          />
        </SectionCard>

        <SectionCard title="Data" delay={240}>
          <SettingRow
            icon="cloud-done-outline" iconColor="#10B981" label="Backup & Sync"
            subtitle="Last synced: Today" onPress={handlers.backup}
            right={
              <View style={[s.badge, { backgroundColor: '#10B98118' }]}>
                <AppText variant="caption" style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>ON</AppText>
              </View>
            }
          />
          <SettingRow
            icon="download-outline" iconColor="#8B5CF6" label="Export Data"
            subtitle={`${data.txCount} transactions ready`}
            onPress={sheets.export.open}
          />
          <SettingRow
            icon="trash-outline" iconColor="#EF4444" label="Clear All Data"
            subtitle="Reset to demo — cannot be undone"
            onPress={confirms.clearData.show}
            isLast
          />
        </SectionCard>

        <SectionCard title="Support" delay={320}>
          <SettingRow icon="help-circle-outline"        iconColor="#06B6D4" label="Help & Support"   subtitle="FAQs and contact"       onPress={sheets.help.open} />
          <SettingRow icon="star-outline"               iconColor="#FBBF24" label="Rate WhereCash"   subtitle="Share your feedback"    onPress={confirms.rate.show} />
          <SettingRow
            icon="information-circle-outline" iconColor={colors.text.tertiary}
            label="About" subtitle="v1.0.0 · Build 100" isLast
            onPress={() => toast.info('WhereCash v1.0.0 — Built with Expo & React Native')}
          />
        </SectionCard>

        <Animated.View style={useEntrance(400)}>
          <Pressable
            onPress={confirms.signOut.show}
            style={({ pressed }) => [
              s.signOutBtn,
              {
                backgroundColor: isDark ? '#EF444418' : '#FEF2F2',
                borderColor:     isDark ? '#EF444430' : '#FCA5A5',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <AppText variant="labelLG" style={{ color: '#EF4444' }}>Sign Out</AppText>
          </Pressable>
          <AppText variant="caption" color={colors.text.tertiary} align="center" style={{ marginTop: Spacing['3'] }}>
            WhereCash v1.0.0 · Made with ♥
          </AppText>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Sheets ── */}
      <ProfileBottomSheet visible={sheets.currency.isOpen}      onClose={sheets.currency.close}      title="Currency & Region"    snapHeight={520}>
        <CurrencySheet current={data.user?.currency ?? 'USD'} onSelect={handlers.selectCurrency} />
      </ProfileBottomSheet>

      <ProfileBottomSheet visible={sheets.notifications.isOpen} onClose={sheets.notifications.close} title="Notifications"        snapHeight={400}>
        <NotifSheet prefs={preferences.notifications} onChange={preferences.updateNotification} />
      </ProfileBottomSheet>

      <ProfileBottomSheet visible={sheets.security.isOpen}      onClose={sheets.security.close}      title="Security & Privacy"  snapHeight={420}>
        <SecuritySheet prefs={preferences.security} onChange={preferences.updateSecurity} />
      </ProfileBottomSheet>

      <ProfileBottomSheet visible={sheets.export.isOpen}        onClose={sheets.export.close}        title="Export Data"          snapHeight={340}>
        <ExportSheet onExport={handlers.exportData} />
      </ProfileBottomSheet>

      <ProfileBottomSheet visible={sheets.help.isOpen}          onClose={sheets.help.close}          title="Help & Support"       snapHeight={560}>
        <HelpSheet />
      </ProfileBottomSheet>

      {/* ── Confirm Modals ── */}
      <ConfirmModal
        visible={confirms.signOut.isVisible}
        title="Sign Out"
        message="You'll need to sign in again to access your account."
        confirmLabel="Sign Out" cancelLabel="Stay" danger icon="log-out-outline"
        onConfirm={confirms.signOut.confirm}
        onCancel={confirms.signOut.dismiss}
      />
      <ConfirmModal
        visible={confirms.clearData.isVisible}
        title="Clear All Data?"
        message="This will permanently erase all transactions, accounts, budgets, ledger entries and planned payments. This cannot be undone."
        confirmLabel="Clear Everything" cancelLabel="Cancel" danger icon="trash-outline"
        onConfirm={confirms.clearData.confirm}
        onCancel={confirms.clearData.dismiss}
      />
      <ConfirmModal
        visible={confirms.rate.isVisible}
        title="Rate WhereCash ⭐"
        message="Enjoying the app? Your review helps us reach more people."
        confirmLabel="Rate Now" cancelLabel="Later" icon="star"
        onConfirm={confirms.rate.confirm}
        onCancel={confirms.rate.dismiss}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea:   { flex: 1 },
  scroll:     { paddingHorizontal: Spacing['5'], paddingTop: Spacing['3'], gap: Spacing['4'] },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], paddingVertical: Spacing['4'],
    borderRadius: Radius.xl, borderWidth: 1,
  },
});
