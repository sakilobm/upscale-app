import React, { useCallback } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { CustomButton } from '@components/CustomButton';
import { Colors, Spacing, Radius, Layout } from '@constants/index';
import { useAuth } from '@hooks/useAuth';
import { CURRENCY_SYMBOLS } from '@store/types';

const MENU_ITEMS = [
  { emoji: '🔔', label: 'Notifications', onPress: () => {} },
  { emoji: '💰', label: 'Currency & Region', onPress: () => {} },
  { emoji: '🔐', label: 'Security & Privacy', onPress: () => {} },
  { emoji: '☁️', label: 'Backup & Sync', onPress: () => {} },
  { emoji: '📊', label: 'Export Data', onPress: () => {} },
  { emoji: '❓', label: 'Help & Support', onPress: () => {} },
] as const;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = useCallback(() => {
    signOut();
  }, [signOut]);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AM';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="headingLG" style={styles.title}>
          Profile
        </AppText>

        {/* Avatar + Name */}
        <GlassCard style={styles.profileCard} borderGlow>
          <View style={styles.profileInner}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={Colors.gradients.purpleBlue as unknown as [string, string]}
                style={styles.avatarGradient}
              >
                <AppText style={styles.avatarText}>{initials}</AppText>
              </LinearGradient>
            </View>
            <View style={styles.profileText}>
              <AppText variant="headingMD">{user?.fullName ?? 'Guest'}</AppText>
              <AppText variant="bodySM" color={Colors.text.secondary}>
                {user?.email ?? ''}
              </AppText>
              <View style={styles.currencyBadge}>
                <AppText variant="caption" color={Colors.brand.secondary}>
                  {user?.currency ?? 'USD'} · {CURRENCY_SYMBOLS[user?.currency ?? 'USD']}
                </AppText>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Menu */}
        <GlassCard style={styles.menuCard} padding={0}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              style={({ pressed }) => [
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                pressed && styles.menuItemPressed,
              ]}
            >
              <AppText style={styles.menuEmoji}>{item.emoji}</AppText>
              <AppText variant="labelLG" color={Colors.text.primary} style={styles.menuLabel}>
                {item.label}
              </AppText>
              <AppText color={Colors.text.tertiary}>›</AppText>
            </Pressable>
          ))}
        </GlassCard>

        {/* Sign out */}
        <CustomButton
          label="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOut}
        />

        <AppText variant="caption" color={Colors.text.tertiary} align="center">
          MoneyApp v1.0.0
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    gap: Spacing['4'],
  },
  title: {
    marginBottom: Spacing['2'],
  },
  profileCard: {},
  profileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['4'],
  },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  currencyBadge: {
    backgroundColor: Colors.brand.primary + '25',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  menuCard: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['5'],
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glass.border,
  },
  menuItemPressed: {
    backgroundColor: Colors.glass.background,
  },
  menuEmoji: {
    fontSize: 20,
  },
  menuLabel: {
    flex: 1,
  },
  signOut: {
    marginTop: Spacing['2'],
  },
});
