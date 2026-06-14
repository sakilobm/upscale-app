import {
  View, StyleSheet, ScrollView, Pressable, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { NotificationCard } from '@components/notifications/NotificationCard';
import { ReminderCard } from '@components/notifications/ReminderCard';
import { AddReminderSheet } from '@components/notifications/AddReminderSheet';
import { useNotificationsScreen } from '@features/notifications/hooks/useNotificationsScreen';
import type { NotificationTab } from '@features/notifications/hooks/useNotificationsScreen';

const TABS: { id: NotificationTab; label: string }[] = [
  { id: 'inbox',     label: 'Inbox'     },
  { id: 'reminders', label: 'Reminders' },
];

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const screen = useNotificationsScreen();
  const bg   = isDark ? colors.background.primary : '#F6F6FB';
  const card = isDark ? colors.background.secondary : '#FFFFFF';

  const SETTINGS_ROWS = [
    { key: 'budgetExceeded',   label: 'Budget Exceeded',   icon: 'alert-circle',      color: '#EF4444' },
    { key: 'budgetWarning',    label: 'Budget Warning',    icon: 'warning',            color: '#F59E0B' },
    { key: 'paymentDue',       label: 'Payment Due',       icon: 'calendar',           color: '#3B82F6' },
    { key: 'remindersEnabled', label: 'Reminders',         icon: 'alarm',              color: '#8B5CF6' },
  ] as const;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['top']}>
      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.springify().damping(22)} style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <AppText variant="headingSM" color={colors.text.primary} style={s.title}>
          Notifications
        </AppText>
        {screen.activeTab === 'inbox' && screen.notifications.length > 0 ? (
          <Pressable onPress={screen.handlers.markAllRead} hitSlop={8}>
            <AppText variant="labelSM" color={colors.brand.accent}>Mark all read</AppText>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </Animated.View>

      {/* ── Tab switcher ── */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).delay(40)}
        style={[s.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}
      >
        {TABS.map(({ id, label }) => {
          const active = screen.activeTab === id;
          return (
            <Pressable key={id} onPress={() => screen.setActiveTab(id)} style={s.tabItem}>
              {active && (
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    s.tabPill,
                    { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' },
                    Platform.select({
                      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
                      android: { elevation: 3 },
                    }),
                  ]}
                />
              )}
              <AppText
                variant="labelMD"
                style={{ color: active ? colors.text.primary : colors.text.tertiary, fontWeight: active ? '700' : '500' }}
              >
                {label}
              </AppText>
              {id === 'inbox' && screen.unreadCount > 0 && (
                <View style={s.badge}>
                  <AppText style={s.badgeText}>{screen.unreadCount > 9 ? '9+' : screen.unreadCount}</AppText>
                </View>
              )}
            </Pressable>
          );
        })}
      </Animated.View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ─────── INBOX ─────── */}
        {screen.activeTab === 'inbox' && (
          <>
            {/* Notification settings */}
            <Animated.View
              entering={FadeInDown.springify().damping(22).delay(80)}
              style={[s.settingsCard, { backgroundColor: card, borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}
            >
              <AppText variant="labelMD" color={colors.text.secondary} style={s.sectionLabel}>
                Notify me about
              </AppText>
              {SETTINGS_ROWS.map(({ key, label, icon, color }) => (
                <View key={key} style={[s.settingRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[s.settingIcon, { backgroundColor: color + '18' }]}>
                    <Ionicons name={icon} size={16} color={color} />
                  </View>
                  <AppText variant="bodyMD" color={colors.text.primary} style={{ flex: 1 }}>
                    {label}
                  </AppText>
                  <Switch
                    value={screen.settings[key]}
                    onValueChange={() => screen.handlers.toggleSetting(key)}
                    trackColor={{ false: colors.text.tertiary + '40', true: color + '50' }}
                    thumbColor={screen.settings[key] ? color : colors.text.tertiary}
                    ios_backgroundColor={colors.text.tertiary + '40'}
                    style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
                  />
                </View>
              ))}
            </Animated.View>

            {/* Clear all */}
            {screen.notifications.length > 0 && (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(120)} style={s.clearRow}>
                <AppText variant="caption" color={colors.text.tertiary}>
                  {screen.notifications.length} notification{screen.notifications.length !== 1 ? 's' : ''}
                </AppText>
                <Pressable onPress={screen.handlers.clearAll} hitSlop={8}>
                  <AppText variant="caption" style={{ color: '#EF4444', fontWeight: '600' }}>Clear All</AppText>
                </Pressable>
              </Animated.View>
            )}

            {/* Notification list */}
            {screen.notifications.length === 0 ? (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(160)} style={s.emptyWrap}>
                <View style={s.emptyIcon}>
                  <Ionicons name="notifications-off-outline" size={36} color={colors.text.tertiary} />
                </View>
                <AppText variant="headingSM" color={colors.text.secondary} align="center">
                  All caught up
                </AppText>
                <AppText variant="bodyMD" color={colors.text.tertiary} align="center">
                  Budget alerts and payment reminders will show here.
                </AppText>
              </Animated.View>
            ) : (
              <View style={s.listGap}>
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

        {/* ─────── REMINDERS ─────── */}
        {screen.activeTab === 'reminders' && (
          <>
            {!screen.hasPermission && (
              <Animated.View
                entering={FadeInDown.springify().damping(22).delay(60)}
                style={[s.permissionBanner, { borderColor: '#F59E0B60' }]}
              >
                <LinearGradient colors={['#F59E0B20', '#FB923C10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                <AppText variant="bodyMD" color={colors.text.secondary} style={{ flex: 1 }}>
                  Enable notifications to receive scheduled reminders
                </AppText>
              </Animated.View>
            )}

            {screen.reminders.length === 0 ? (
              <Animated.View entering={FadeInDown.springify().damping(22).delay(100)} style={s.emptyWrap}>
                <View style={s.emptyIcon}>
                  <Ionicons name="alarm-outline" size={36} color={colors.text.tertiary} />
                </View>
                <AppText variant="headingSM" color={colors.text.secondary} align="center">
                  No reminders yet
                </AppText>
                <AppText variant="bodyMD" color={colors.text.tertiary} align="center">
                  Add a reminder to stay on top of your finances.
                </AppText>
              </Animated.View>
            ) : (
              <View style={s.listGap}>
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
            <LinearGradient colors={['#8B5CF6', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.fabGradient}>
              <Ionicons name="add" size={24} color="#fff" />
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
  safe:   { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 4,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, gap: 6, borderRadius: 11,
  },
  tabPill:   { borderRadius: 11 },
  badge: {
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  scroll: { paddingTop: 4 },

  settingsCard: {
    marginHorizontal: 16, borderRadius: 18, borderWidth: 1,
    marginBottom: 8, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionLabel: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, letterSpacing: 0.3 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
  },
  settingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  clearRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 6,
  },

  listGap: { gap: 0 },

  emptyWrap: {
    alignItems: 'center', paddingHorizontal: 40, paddingTop: 48, gap: 12,
  },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: 'rgba(100,116,139,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },

  permissionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    overflow: 'hidden',
  },

  fab: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
  },
  fabBtn:      { borderRadius: 18, overflow: 'hidden' },
  fabGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56 },
  fabLabel:    { color: '#fff', fontSize: 16, fontWeight: '800' },
});
