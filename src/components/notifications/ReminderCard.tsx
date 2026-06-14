import { View, StyleSheet, Pressable, Switch, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import type { NotificationReminder, RepeatInterval } from '@store/notificationStore';

const REPEAT_LABEL: Record<RepeatInterval, string> = {
  none:    'Once',
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
};

function fmt24to12(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

interface Props {
  reminder: NotificationReminder;
  index:    number;
  onToggle: () => void;
  onDelete: () => void;
}

export function ReminderCard({ reminder, index, onToggle, onDelete }: Props) {
  const { colors, isDark } = useTheme();
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
          opacity:         reminder.isActive ? 1 : 0.55,
        },
        Platform.select({
          ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 8 },
          android: { elevation: isDark ? 0 : 2 },
        }),
      ]}
    >
      {/* Icon */}
      <View style={[s.iconCircle, { backgroundColor: '#8B5CF620' }]}>
        <Ionicons name="alarm" size={20} color="#8B5CF6" />
      </View>

      {/* Content */}
      <View style={s.content}>
        <AppText
          variant="labelMD"
          color={colors.text.primary}
          numberOfLines={1}
          style={{ fontWeight: reminder.isActive ? '600' : '400' }}
        >
          {reminder.title}
        </AppText>
        <View style={s.metaRow}>
          <View style={s.timePill}>
            <Ionicons name="time-outline" size={11} color="#8B5CF6" />
            <AppText style={{ fontSize: 11, color: '#8B5CF6', fontWeight: '600' }}>
              {fmt24to12(reminder.time)}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.text.tertiary}>
            {REPEAT_LABEL[reminder.repeat]}
          </AppText>
        </View>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <Switch
          value={reminder.isActive}
          onValueChange={onToggle}
          trackColor={{ false: colors.text.tertiary + '40', true: '#8B5CF640' }}
          thumbColor={reminder.isActive ? '#8B5CF6' : colors.text.tertiary}
          ios_backgroundColor={colors.text.tertiary + '40'}
          style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
        />
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={colors.text.tertiary} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    borderRadius:    18,
    borderWidth:     1,
    marginHorizontal: 16,
    marginVertical:   4,
    padding:          14,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  content: { flex: 1, gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#8B5CF615', paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
});
