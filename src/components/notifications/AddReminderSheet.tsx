import { useState, useEffect } from 'react';
import {
  View, StyleSheet, Pressable, TextInput, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import type { ReminderFormState } from '@features/notifications/hooks/useNotificationsScreen';
import { DEFAULT_REMINDER_FORM } from '@features/notifications/hooks/useNotificationsScreen';
import type { RepeatInterval } from '@store/notificationStore';

const ACCENT = '#8B5CF6';

const REPEAT_OPTIONS: { label: string; value: RepeatInterval }[] = [
  { label: 'Once',    value: 'none'    },
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

// ─── Time utilities ─────────────────────────────────────────────────────────

interface TimeState { hour: number; minute: number; ampm: 'AM' | 'PM'; }

function parse24h(time: string): TimeState {
  const [h, m] = time.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour: hour12, minute: m, ampm };
}

function to24h(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'AM') { if (h === 12) h = 0; }
  else               { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// ─── TimeStepper ────────────────────────────────────────────────────────────

function TimeStepper({
  label, display, onIncrement, onDecrement, isDark,
}: {
  label: string;
  display: string;
  onIncrement: () => void;
  onDecrement: () => void;
  isDark: boolean;
}) {
  return (
    <View style={ts.wrap}>
      <Pressable
        onPress={onIncrement}
        hitSlop={14}
        style={({ pressed }) => [ts.btn, { opacity: pressed ? 0.55 : 1 }]}
      >
        <Ionicons name="chevron-up" size={22} color={ACCENT} />
      </Pressable>

      <View style={[ts.display, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '50' }]}>
        <AppText style={[ts.value, { color: isDark ? '#F1F5F9' : '#0A0A0A' }]}>
          {display}
        </AppText>
      </View>

      <Pressable
        onPress={onDecrement}
        hitSlop={14}
        style={({ pressed }) => [ts.btn, { opacity: pressed ? 0.55 : 1 }]}
      >
        <Ionicons name="chevron-down" size={22} color={ACCENT} />
      </Pressable>

      <AppText style={[ts.label, { color: isDark ? 'rgba(148,163,184,0.7)' : 'rgba(0,0,0,0.4)' }]}>
        {label}
      </AppText>
    </View>
  );
}

const ts = StyleSheet.create({
  wrap:    { alignItems: 'center', gap: 4 },
  btn:     { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  display: {
    width: 76, height: 62, borderRadius: 18, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  value: {
    fontSize: 30, fontWeight: '800', letterSpacing: -1,
    // fontVariant: ['tabular-nums'],  // not supported on Android < 12
  },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, marginTop: 2 },
});

// ─── AmPmToggle ─────────────────────────────────────────────────────────────

function AmPmToggle({
  value, onChange, isDark,
}: {
  value: 'AM' | 'PM';
  onChange: (v: 'AM' | 'PM') => void;
  isDark: boolean;
}) {
  const trackBg  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const trackBdr = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  return (
    <View style={[amp.track, { backgroundColor: trackBg, borderColor: trackBdr }]}>
      {(['AM', 'PM'] as const).map((v) => {
        const active = value === v;
        return (
          <Pressable
            key={v}
            onPress={() => { Haptics.selectionAsync(); onChange(v); }}
            style={[amp.btn, active && [amp.btnActive, { backgroundColor: ACCENT }]]}
          >
            <AppText style={[amp.txt, { color: active ? '#fff' : (isDark ? 'rgba(148,163,184,0.7)' : 'rgba(0,0,0,0.4)') }]}>
              {v}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const amp = StyleSheet.create({
  track:     { borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 3, gap: 3, alignSelf: 'center', marginTop: 8 },
  btn:       { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  btnActive: {},
  txt:       { fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
});

// ─── AddReminderSheet ────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave:  (form: ReminderFormState) => void;
}

export function AddReminderSheet({ visible, onClose, onSave }: Props) {
  const { colors, isDark } = useTheme();
  const [form,      setForm]      = useState<ReminderFormState>(DEFAULT_REMINDER_FORM);
  const [timeState, setTimeState] = useState<TimeState>(parse24h(DEFAULT_REMINDER_FORM.time));

  useEffect(() => {
    if (visible) {
      setForm(DEFAULT_REMINDER_FORM);
      setTimeState(parse24h(DEFAULT_REMINDER_FORM.time));
    }
  }, [visible]);

  const inputBg     = isDark ? colors.background.secondary : '#F4F4F8';
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';

  function updateHour(h: number) {
    setTimeState((t) => {
      const next = { ...t, hour: h };
      setForm((f) => ({ ...f, time: to24h(next.hour, next.minute, next.ampm) }));
      return next;
    });
  }

  function updateMinute(m: number) {
    setTimeState((t) => {
      const next = { ...t, minute: m };
      setForm((f) => ({ ...f, time: to24h(next.hour, next.minute, next.ampm) }));
      return next;
    });
  }

  function updateAmPm(ampm: 'AM' | 'PM') {
    setTimeState((t) => {
      const next = { ...t, ampm };
      setForm((f) => ({ ...f, time: to24h(next.hour, next.minute, next.ampm) }));
      return next;
    });
  }

  const sheetBg = isDark ? colors.background.secondary : '#FFFFFF';
  const divider = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Root: positions sheet at bottom */}
      <View style={s.root}>

        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <View style={[RN.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.52)' }]} />
          </Pressable>
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.springify().damping(28).stiffness(220)}
          exiting={SlideOutDown.springify().damping(28).stiffness(220)}
          style={[s.sheet, { backgroundColor: sheetBg }]}
        >
          {/* Drag handle */}
          <View style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: ACCENT + '18' }]}>
              <Ionicons name="alarm" size={18} color={ACCENT} />
            </View>
            <AppText variant="headingSM" color={colors.text.primary} style={{ flex: 1 }}>
              Add Reminder
            </AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Body */}
          <View style={s.body}>

            {/* Title */}
            <View style={s.field}>
              <AppText variant="labelSM" color={colors.text.secondary} style={s.fieldLabel}>Title</AppText>
              <View style={[s.inputBox, { backgroundColor: inputBg, borderColor: form.title ? ACCENT + '80' : inputBorder }]}>
                <TextInput
                  style={[s.input, { color: colors.text.primary }]}
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="e.g. Check my budget"
                  placeholderTextColor={colors.text.tertiary}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Note */}
            <View style={s.field}>
              <AppText variant="labelSM" color={colors.text.secondary} style={s.fieldLabel}>Note (optional)</AppText>
              <View style={[s.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TextInput
                  style={[s.input, { color: colors.text.primary }]}
                  value={form.body}
                  onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                  placeholder="e.g. Review spending this week"
                  placeholderTextColor={colors.text.tertiary}
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Time picker */}
            <View style={s.field}>
              <AppText variant="labelSM" color={colors.text.secondary} style={s.fieldLabel}>Time</AppText>
              <View style={[s.timePicker, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <TimeStepper
                  label="HR"
                  display={String(timeState.hour).padStart(2, '0')}
                  isDark={isDark}
                  onIncrement={() => { Haptics.selectionAsync(); updateHour(timeState.hour >= 12 ? 1 : timeState.hour + 1); }}
                  onDecrement={() => { Haptics.selectionAsync(); updateHour(timeState.hour <= 1  ? 12 : timeState.hour - 1); }}
                />

                <AppText style={[s.colon, { color: isDark ? '#F1F5F9' : '#0A0A0A' }]}>:</AppText>

                <TimeStepper
                  label="MIN"
                  display={String(timeState.minute).padStart(2, '0')}
                  isDark={isDark}
                  onIncrement={() => { Haptics.selectionAsync(); updateMinute(timeState.minute >= 59 ? 0  : timeState.minute + 1); }}
                  onDecrement={() => { Haptics.selectionAsync(); updateMinute(timeState.minute <= 0  ? 59 : timeState.minute - 1); }}
                />

                <View style={s.ampmWrap}>
                  <AmPmToggle value={timeState.ampm} onChange={updateAmPm} isDark={isDark} />
                </View>
              </View>
            </View>

            {/* Repeat */}
            <View style={s.field}>
              <AppText variant="labelSM" color={colors.text.secondary} style={s.fieldLabel}>Repeat</AppText>
              <View style={s.repeatRow}>
                {REPEAT_OPTIONS.map(({ label, value }) => {
                  const active = form.repeat === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => { Haptics.selectionAsync(); setForm((f) => ({ ...f, repeat: value })); }}
                      style={[
                        s.repeatChip,
                        { backgroundColor: active ? ACCENT : inputBg, borderColor: active ? ACCENT : inputBorder },
                      ]}
                    >
                      <AppText style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : colors.text.secondary }}>
                        {label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Save button */}
          <View style={[s.footer, { borderTopColor: divider }]}>
            <Pressable
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSave(form); }}
              style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={[ACCENT, '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveGrad}
              >
                <Ionicons name="checkmark" size={18} color="#fff" />
                <AppText style={s.saveTxt}>Save Reminder</AppText>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.14, shadowRadius: 20 },
      android: { elevation: 24 },
    }),
  },
  handle:    { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 },
  headerIcon:{ width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  body:  { paddingHorizontal: 20, paddingBottom: 8, gap: 20 },
  field: { gap: 10 },
  fieldLabel: { letterSpacing: 0.2, fontWeight: '600' },

  inputBox: { height: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, justifyContent: 'center' },
  input:    { fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  timePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, borderWidth: 1.5, paddingVertical: 16, paddingHorizontal: 20, gap: 12,
  },
  colon:   { fontSize: 32, fontWeight: '800', marginBottom: 22, letterSpacing: -2 },
  ampmWrap:{ alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  repeatRow:  { flexDirection: 'row', gap: 8 },
  repeatChip: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  footer:   { borderTopWidth: 1, padding: 16, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
  saveBtn:  { borderRadius: 16, overflow: 'hidden' },
  saveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
  saveTxt:  { color: '#fff', fontSize: 16, fontWeight: '800' },
});
