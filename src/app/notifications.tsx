import { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, Platform, Switch,
} from 'react-native';
import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { NotificationCard } from '@components/notifications/NotificationCard';
import { ReminderCard } from '@components/notifications/ReminderCard';
import { AddReminderSheet } from '@components/notifications/AddReminderSheet';
import { useNotificationsScreen } from '@features/notifications/hooks/useNotificationsScreen';
import type { NotificationTab } from '@features/notifications/hooks/useNotificationsScreen';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TAB_H = 52;

const TABS: { id: NotificationTab; label: string; active: IoniconName; inactive: IoniconName }[] = [
  { id: 'inbox',     label: 'Inbox',     active: 'mail',  inactive: 'mail-outline'  },
  { id: 'reminders', label: 'Reminders', active: 'alarm', inactive: 'alarm-outline' },
];

const SETTINGS_ROWS = [
  {
    key:   'budgetExceeded'   as const,
    label: 'Budget Exceeded',
    sub:   'When spending goes over limit',
    icon:  'alert-circle'    as IoniconName,
    color: '#EF4444',
  },
  {
    key:   'budgetWarning'    as const,
    label: 'Budget Warning',
    sub:   'At 80% of your budget',
    icon:  'warning'          as IoniconName,
    color: '#F59E0B',
  },
  {
    key:   'paymentDue'       as const,
    label: 'Payment Due',
    sub:   'Upcoming planned payments',
    icon:  'calendar'         as IoniconName,
    color: '#3B82F6',
  },
  {
    key:   'remindersEnabled' as const,
    label: 'Reminders',
    sub:   'Scheduled personal reminders',
    icon:  'alarm'            as IoniconName,
    color: '#8B5CF6',
  },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const screen = useNotificationsScreen();
  const bg   = isDark ? colors.background.primary : '#F0F0F8';
  const card = isDark ? colors.background.secondary : '#FFFFFF';

  // Sliding animated tab pill
  const [barW, setBarW] = useState(320);
  const pillX = useSharedValue(0);
  useEffect(() => {
    const to = screen.activeTab === 'inbox' ? 0 : (barW - 8) / 2;
    pillX.value = withSpring(to, { damping: 24, stiffness: 280, mass: 0.8 });
  }, [screen.activeTab, barW]);
  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['top']}>

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.springify().damping(22)} style={s.header}>
        <Pressable
          onPress={() => router.back()}
          style={[s.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
        <View style={s.headerText}>
          <AppText variant="headingSM" color={colors.text.primary} style={s.headerTitle}>
            Notifications
          </AppText>
          {screen.unreadCount > 0 && (
            <AppText variant="caption" color={colors.text.tertiary}>
              {screen.unreadCount} unread message{screen.unreadCount !== 1 ? 's' : ''}
            </AppText>
          )}
        </View>
        {screen.activeTab === 'inbox' && screen.notifications.length > 0 ? (
          <Pressable
            onPress={screen.handlers.markAllRead}
            style={[s.markAllBtn, { backgroundColor: colors.brand.accent + '14' }]}
            hitSlop={8}
          >
            <AppText variant="labelSM" color={colors.brand.accent} style={{ fontWeight: '700' }}>
              Mark read
            </AppText>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </Animated.View>

      {/* ── Sliding tab bar ── */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).delay(40)}
        style={[s.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }]}
        onLayout={(e) => setBarW(e.nativeEvent.layout.width)}
      >
        {/* Animated sliding pill */}
        <Animated.View
          style={[
            s.slidingPill,
            pillStyle,
            {
              width: (barW - 8) / 2,
              backgroundColor: card,
              ...Platform.select({
                ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6 },
                android: { elevation: 4 },
              }),
            },
          ]}
        />

        {TABS.map(({ id, label, active, inactive }) => {
          const isActive = screen.activeTab === id;
          return (
            <Pressable key={id} onPress={() => screen.setActiveTab(id)} style={s.tabItem}>
              <Ionicons
                name={isActive ? active : inactive}
                size={16}
                color={isActive ? colors.text.primary : colors.text.tertiary}
              />
              <AppText
                variant="labelMD"
                style={{
                  color:      isActive ? colors.text.primary : colors.text.tertiary,
                  fontWeight: isActive ? '800' : '500',
                }}
              >
                {label}
              </AppText>
              {id === 'inbox' && screen.unreadCount > 0 && (
                <View style={s.badge}>
                  <AppText style={s.badgeText}>
                    {screen.unreadCount > 9 ? '9+' : screen.unreadCount}
                  </AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 108 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ────────── INBOX ────────── */}
        {screen.activeTab === 'inbox' && (
          <>
            {/* Alert preferences card */}
            <Animated.View
              entering={FadeInDown.springify().damping(22).delay(80)}
              style={[s.settingsCard, { backgroundColor: card }]}
            >
              {/* Card header */}
              <View style={s.settingsCardHeader}>
                <View style={[s.settingsHeaderIcon, { backgroundColor: '#6C63FF18' }]}>
                  <Ionicons name="options-outline" size={16} color="#6C63FF" />
                </View>
                <AppText
                  variant="labelMD"
                  color={colors.text.primary}
                  style={{ fontWeight: '800', letterSpacing: -0.1 }}
                >
                  Alert Preferences
                </AppText>
              </View>

              {/* Setting rows */}
              {SETTINGS_ROWS.map(({ key, label, sub, icon, color }, idx) => (
                <View
                  key={key}
                  style={[
                    s.settingRow,
                    idx > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <View style={[s.settingIcon, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={18} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="labelMD" color={colors.text.primary} style={{ fontWeight: '600' }}>
                      {label}
                    </AppText>
                    <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 1 }}>
                      {sub}
                    </AppText>
                  </View>
                  <Switch
                    value={screen.settings[key]}
                    onValueChange={() => screen.handlers.toggleSetting(key)}
                    trackColor={{
                      false: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                      true:  color + '55',
                    }}
                    thumbColor={screen.settings[key] ? color : (isDark ? '#666' : '#CCC')}
                    ios_backgroundColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
                    style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                  />
                </View>
              ))}
            </Animated.View>

            {/* Count + clear row */}
            {screen.notifications.length > 0 && (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(120)} style={s.clearRow}>
                <AppText variant="caption" color={colors.text.tertiary}>
                  {screen.notifications.length} notification{screen.notifications.length !== 1 ? 's' : ''}
                </AppText>
                <Pressable onPress={screen.handlers.clearAll} hitSlop={8}>
                  <AppText variant="caption" style={{ color: '#EF4444', fontWeight: '700' }}>
                    Clear All
                  </AppText>
                </Pressable>
              </Animated.View>
            )}

            {/* Notification list / empty state */}
            {screen.notifications.length === 0 ? (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(160)} style={s.emptyWrap}>
                <LinearGradient colors={['#6C63FF22', '#A78BFA22']} style={s.emptyIcon}>
                  <Ionicons name="notifications-off-outline" size={40} color="#8B5CF6" />
                </LinearGradient>
                <AppText variant="headingSM" color={colors.text.secondary} align="center" style={{ fontWeight: '800' }}>
                  All caught up!
                </AppText>
                <AppText variant="bodyMD" color={colors.text.tertiary} align="center" style={{ lineHeight: 22 }}>
                  Budget alerts and payment reminders will show here.
                </AppText>
              </Animated.View>
            ) : (
              <View style={{ gap: 0 }}>
                {screen.notifications.map((n, i) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    index={i}
                    onPress={() => screen.handlers.markRead(n.id)}
                    onDelete={() => screen.handlers.delete(n.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* ────────── REMINDERS ────────── */}
        {screen.activeTab === 'reminders' && (
          <>
            {!screen.hasPermission && (
              <Animated.View
                entering={FadeInDown.springify().damping(22).delay(60)}
                style={[s.permBanner, { borderColor: '#F59E0B50' }]}
              >
                <LinearGradient
                  colors={['#F59E0B1A', '#FB923C0D']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[s.permIcon, { backgroundColor: '#F59E0B20' }]}>
                  <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                </View>
                <AppText variant="bodyMD" color={colors.text.secondary} style={{ flex: 1, lineHeight: 20 }}>
                  Enable notifications to receive scheduled reminders
                </AppText>
              </Animated.View>
            )}

            {screen.reminders.length === 0 ? (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(100)} style={s.emptyWrap}>
                <LinearGradient colors={['#8B5CF622', '#A78BFA22']} style={s.emptyIcon}>
                  <Ionicons name="alarm-outline" size={40} color="#8B5CF6" />
                </LinearGradient>
                <AppText variant="headingSM" color={colors.text.secondary} align="center" style={{ fontWeight: '800' }}>
                  No reminders yet
                </AppText>
                <AppText variant="bodyMD" color={colors.text.tertiary} align="center" style={{ lineHeight: 22 }}>
                  Tap the button below to schedule your first finance reminder.
                </AppText>
              </Animated.View>
            ) : (
              <View style={{ gap: 0 }}>
                {screen.reminders.map((r, i) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    index={i}
                    onToggle={() => screen.handlers.toggleReminder(r.id)}
                    onDelete={() => screen.handlers.deleteReminder(r.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Reminders FAB ── */}
      {screen.activeTab === 'reminders' && (
        <Animated.View entering={FadeInDown.springify().damping(22)} style={s.fab}>
          <Pressable
            onPress={screen.openAddSheet}
            style={({ pressed }) => [s.fabBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={['#7C3AED', '#A78BFA']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.fabGrad}
            >
              <Ionicons name="add" size={22} color="#fff" />
              <AppText style={s.fabLabel}>Add Reminder</AppText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}

      <AddReminderSheet
        visible={screen.addSheetVisible}
        onClose={screen.closeAddSheet}
        onSave={screen.handlers.addReminder}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { fontWeight: '800', letterSpacing: -0.4, fontSize: 20 },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 4,
    height: TAB_H,
    position: 'relative', alignItems: 'center',
  },
  slidingPill: {
    position: 'absolute', top: 4, left: 4,
    height: TAB_H - 8, borderRadius: 12,
  },
  tabItem: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 6, zIndex: 1, height: TAB_H - 8,
  },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // Settings card
  settingsCard: {
    marginHorizontal: 16, borderRadius: 20,
    overflow: 'hidden', marginBottom: 10,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  settingsCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  settingsHeaderIcon: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  settingIcon: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },

  // Clear row
  clearRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 6,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center', paddingHorizontal: 40, paddingTop: 60, gap: 14,
  },
  emptyIcon: {
    width: 92, height: 92, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },

  // Permission banner
  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1.5, padding: 14,
    overflow: 'hidden',
  },
  permIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // FAB
  fab: { position: 'absolute', bottom: 28, left: 16, right: 16 },
  fabBtn: { borderRadius: 20, overflow: 'hidden' },
  fabGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, height: 58,
  },
  fabLabel: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});
