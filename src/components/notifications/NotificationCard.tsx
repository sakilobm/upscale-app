import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { format, isToday, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import type { AppNotification, NotificationType } from '@store/notificationStore';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const TYPE_META: Record<NotificationType, { icon: IoniconName; color: string }> = {
  budget_exceeded: { icon: 'alert-circle',        color: '#EF4444' },
  budget_warning:  { icon: 'warning',              color: '#F59E0B' },
  payment_due:     { icon: 'calendar',             color: '#3B82F6' },
  reminder:        { icon: 'alarm',                color: '#8B5CF6' },
  system:          { icon: 'information-circle',   color: '#64748B' },
};

function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d))     return formatDistanceToNowStrict(d, { addSuffix: true });
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

interface Props {
  notification: AppNotification;
  index:        number;
  onPress:      () => void;
  onDelete:     () => void;
}

export function NotificationCard({ notification, index, onPress, onDelete }: Props) {
  const { colors, isDark } = useTheme();
  const meta = TYPE_META[notification.type];
  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(22).stiffness(140).delay(index * 40)}
      exiting={FadeOutLeft.duration(200)}
      style={[
        s.card,
        {
          backgroundColor: cardBg,
          borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          opacity:         notification.isRead ? 0.7 : 1,
        },
        Platform.select({
          ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 8 },
          android: { elevation: isDark ? 0 : 2 },
        }),
      ]}
    >
      <Pressable onPress={onPress} style={s.pressable}>
        {/* Icon */}
        <View style={[s.iconCircle, { backgroundColor: meta.color + '18' }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        {/* Content */}
        <View style={s.content}>
          <View style={s.titleRow}>
            <AppText
              variant="labelMD"
              color={colors.text.primary}
              style={[s.title, !notification.isRead && { fontWeight: '700' }]}
              numberOfLines={1}
            >
              {notification.title}
            </AppText>
            {!notification.isRead && (
              <View style={[s.unreadDot, { backgroundColor: meta.color }]} />
            )}
          </View>
          <AppText variant="bodyMD" color={colors.text.secondary} numberOfLines={2} style={s.body}>
            {notification.body}
          </AppText>
          <AppText variant="caption" color={colors.text.tertiary} style={s.time}>
            {relativeTime(notification.createdAt)}
          </AppText>
        </View>
      </Pressable>

      {/* Delete */}
      <Pressable onPress={onDelete} style={s.deleteBtn} hitSlop={8}>
        <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection:  'row',
    alignItems:     'center',
    borderRadius:   18,
    borderWidth:    1,
    marginHorizontal: 16,
    marginVertical:   4,
    overflow:       'hidden',
  },
  pressable:  { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  iconCircle: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  content:   { flex: 1, gap: 3 },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:     { flex: 1, fontSize: 14, letterSpacing: -0.1 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, flexShrink: 0 },
  body:      { fontSize: 13, lineHeight: 18 },
  time:      { fontSize: 11 },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 18 },
});
