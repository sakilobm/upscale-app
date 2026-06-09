import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { AppHeader } from '@components/AppHeader';
import { CustomButton } from '@components/CustomButton';
import { Spacing, Radius, Layout } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { CURRENCY_SYMBOLS } from '@store/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const MENU_ITEMS: { icon: IoniconName; label: string }[] = [
  { icon: 'notifications-outline',   label: 'Notifications'      },
  { icon: 'globe-outline',           label: 'Currency & Region'  },
  { icon: 'lock-closed-outline',     label: 'Security & Privacy' },
  { icon: 'cloud-outline',           label: 'Backup & Sync'      },
  { icon: 'download-outline',        label: 'Export Data'        },
  { icon: 'help-circle-outline',     label: 'Help & Support'     },
];

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = useCallback(() => signOut(), [signOut]);

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AM';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader title="Profile" subtitle={user?.email ?? ''} />

        {/* Avatar + Name */}
        <GlassCard style={styles.profileCard} borderGlow>
          <View style={styles.profileInner}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={colors.gradients.purpleBlue as unknown as [string, string]}
                style={styles.avatarGradient}
              >
                <AppText style={styles.avatarText}>{initials}</AppText>
              </LinearGradient>
            </View>
            <View style={styles.profileText}>
              <AppText variant="headingMD" color={colors.text.primary}>
                {user?.fullName ?? 'Guest'}
              </AppText>
              <AppText variant="bodySM" color={colors.text.secondary}>
                {user?.email ?? ''}
              </AppText>
              <View style={[styles.currencyBadge, { backgroundColor: colors.brand.accent + '20' }]}>
                <AppText variant="caption" color={colors.brand.accent}>
                  {user?.currency ?? 'USD'} · {CURRENCY_SYMBOLS[user?.currency ?? 'USD']}
                </AppText>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Appearance */}
        <GlassCard padding={0} style={styles.menuCard}>
          <View style={[styles.menuItem, styles.menuItemBorder, { borderBottomColor: colors.glass.border }]}>
            <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#1A1040' : '#F0F0F0' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={isDark ? colors.brand.secondary : '#F59E0B'}
              />
            </View>
            <AppText variant="labelLG" color={colors.text.primary} style={styles.menuLabel}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </AppText>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.glass.border, true: colors.brand.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.glass.backgroundMid}
            />
          </View>
        </GlassCard>

        {/* Menu */}
        <GlassCard style={styles.menuCard} padding={0}>
          {MENU_ITEMS.map((item, index) => (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                { borderBottomColor: colors.glass.border },
                pressed && { backgroundColor: colors.glass.background },
              ]}
            >
              <View style={[styles.menuIconBox, { backgroundColor: colors.glass.backgroundMid }]}>
                <Ionicons name={item.icon} size={18} color={colors.text.secondary} />
              </View>
              <AppText variant="labelLG" color={colors.text.primary} style={styles.menuLabel}>
                {item.label}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </Pressable>
          ))}
        </GlassCard>

        <CustomButton
          label="Sign Out"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOut}
        />

        <AppText variant="caption" color={colors.text.tertiary} align="center">
          MoneyApp v1.0.0
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    gap: Spacing['4'],
  },
  title: { marginBottom: 0 },
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
    color: '#FFFFFF',
  },
  profileText: { flex: 1, gap: 4 },
  currencyBadge: {
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
  },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1 },
  signOut: { marginTop: Spacing['2'] },
});
