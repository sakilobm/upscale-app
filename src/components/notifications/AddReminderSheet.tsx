import { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, Pressable, TextInput, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { KeyboardAvoidingSheet } from '@components/KeyboardAvoidingSheet';
import type { ReminderFormState } from '@features/notifications/hooks/useNotificationsScreen';
import { DEFAULT_REMINDER_FORM } from '@features/notifications/hooks/useNotificationsScreen';
import type { RepeatInterval } from '@store/notificationStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_ABBREVS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const REPEAT_OPTIONS: { label: string; value: RepeatInterval; icon: string }[] = [
  { label: 'Once', value: 'none', icon: 'flash-outline' },
  { label: 'Daily', value: 'daily', icon: 'sunny-outline' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' },
  { label: 'Monthly', value: 'monthly', icon: 'refresh-circle-outline' },
];

// ─── Time helpers ─────────────────────────────────────────────────────────────

interface TimeState { hour: number; minute: number; ampm: 'AM' | 'PM'; }

function parse24h(time: string): TimeState {
  const [h, m] = time.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h < 12 ? 'AM' : 'PM';
  return { hour: h === 0 ? 12 : h > 12 ? h - 12 : h, minute: m, ampm };
}

function to24h(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'AM') { if (h === 12) h = 0; }
  else { if (h !== 12) h += 12; }
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayTime(time: string): string {
  const t = parse24h(time);
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')} ${t.ampm}`;
}

// ─── TimeStepper ─────────────────────────────────────────────────────────────

function TimeStepper({ label, display, onInc, onDec }: {
  label: string; display: string;
  onInc: () => void; onDec: () => void;
}) {
  const { colors } = useTheme();
  const accentColor = colors.status.savings;
  return (
    <View style={ts.wrap}>
      <Pressable onPress={onInc} hitSlop={16}
        style={({ pressed }) => [ts.btn, { opacity: pressed ? 0.4 : 1 }]}>
        <Ionicons name="chevron-up" size={22} color={accentColor} />
      </Pressable>
      <View style={[ts.display, { backgroundColor: accentColor + '18', borderColor: accentColor + '55' }]}>
        <AppText style={[ts.value, { color: colors.text.primary }]}>{display}</AppText>
      </View>
      <Pressable onPress={onDec} hitSlop={16}
        style={({ pressed }) => [ts.btn, { opacity: pressed ? 0.4 : 1 }]}>
        <Ionicons name="chevron-down" size={22} color={accentColor} />
      </Pressable>
      <AppText style={[ts.lbl, { color: colors.text.secondary }]}>{label}</AppText>
    </View>
  );
}

const ts = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  btn: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  display: { width: 78, height: 64, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 32, fontWeight: '800', letterSpacing: -1.5 },
  lbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginTop: 2 },
});

// ─── AmPmToggle ──────────────────────────────────────────────────────────────

function AmPmToggle({ value, onChange }: {
  value: 'AM' | 'PM'; onChange: (v: 'AM' | 'PM') => void;
}) {
  const { colors } = useTheme();
  const accentColor = colors.status.savings;
  return (
    <View style={[amp.track, {
      backgroundColor: colors.glass.background,
      borderColor: colors.glass.border,
    }]}>
      {(['AM', 'PM'] as const).map((v) => {
        const active = value === v;
        return (
          <Pressable key={v}
            onPress={() => { Haptics.selectionAsync(); onChange(v); }}
            style={[amp.btn, active && { backgroundColor: accentColor }]}>
            <AppText style={[amp.txt, {
              color: active ? colors.white : colors.text.secondary,
            }]}>{v}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const amp = StyleSheet.create({
  track: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', padding: 3, gap: 3 },
  btn: { paddingHorizontal: 13, paddingVertical: 11, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 14, fontWeight: '800', letterSpacing: 0.4 },
});

// ─── WeekdaySelector ─────────────────────────────────────────────────────────

function WeekdaySelector({ selected, onChange, hasError }: {
  selected: number[]; onChange: (d: number[]) => void;
  hasError: boolean;
}) {
  const { colors } = useTheme();
  const accentColor = colors.status.savings;
  function toggle(day: number) {
    Haptics.selectionAsync();
    onChange(selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day].sort((a, b) => a - b));
  }
  return (
    <View style={{ gap: 8 }}>
      <View style={wd.row}>
        {DAY_ABBREVS.map((abbr, i) => {
          const active = selected.includes(i);
          return (
            <Pressable key={i} onPress={() => toggle(i)}
              style={[wd.pill, {
                backgroundColor: active ? accentColor : colors.glass.background,
                borderColor: active
                  ? accentColor
                  : hasError
                    ? colors.status.expense + '40'
                    : colors.glass.border,
              }]}>
              <AppText style={[wd.txt, {
                color: active ? colors.white : colors.text.secondary,
                fontWeight: active ? '800' : '600',
              }]}>{abbr}</AppText>
            </Pressable>
          );
        })}
      </View>
      {hasError && (
        <View style={s.errRow}>
          <Ionicons name="alert-circle" size={13} color={colors.status.expense} />
          <AppText style={[s.errTxt, { color: colors.status.expense }]}>Select at least one day</AppText>
        </View>
      )}
    </View>
  );
}

const wd = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5 },
  pill: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  txt: { fontSize: 12, letterSpacing: 0.1 },
});

// ─── MiniCalendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ selected, onSelect }: {
  selected: string; onSelect: (d: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    if (selected) {
      const [yr, mo] = selected.split('-').map(Number);
      return new Date(yr, mo - 1, 1);
    }
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const prevSel = useRef(selected?.substring(0, 7) ?? '');
  useEffect(() => {
    const selMonth = selected?.substring(0, 7) ?? '';
    if (selMonth && selMonth !== prevSel.current) {
      const [yr, mo] = selected.split('-').map(Number);
      setViewDate((prev) => {
        if (prev.getFullYear() === yr && prev.getMonth() === mo - 1) return prev;
        return new Date(yr, mo - 1, 1);
      });
    }
    prevSel.current = selMonth;
  }, [selected]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function dayStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const { colors } = useTheme();
  const accentColor = colors.status.savings;
  const textPrimary = colors.text.primary;
  const textDim = colors.text.tertiary;
  const hdrColor = colors.text.secondary;
  const todayBg = accentColor + '20';

  return (
    <View style={{ gap: 2 }}>
      <View style={cl.header}>
        <Pressable onPress={() => setViewDate(new Date(year, month - 1, 1))} hitSlop={12}
          style={({ pressed }) => [cl.navBtn, {
            opacity: pressed ? 0.5 : 1,
            backgroundColor: colors.glass.backgroundMid,
          }]}>
          <Ionicons name="chevron-back" size={16} color={accentColor} />
        </Pressable>
        <AppText style={[cl.monthLbl, { color: textPrimary }]}>{MONTH_NAMES[month]} {year}</AppText>
        <Pressable onPress={() => setViewDate(new Date(year, month + 1, 1))} hitSlop={12}
          style={({ pressed }) => [cl.navBtn, {
            opacity: pressed ? 0.5 : 1,
            backgroundColor: colors.glass.backgroundMid,
          }]}>
          <Ionicons name="chevron-forward" size={16} color={accentColor} />
        </Pressable>
      </View>

      <View style={cl.row}>
        {DAY_ABBREVS.map((d) => (
          <AppText key={d} style={[cl.dow, { color: hdrColor }]}>{d}</AppText>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} style={cl.row}>
          {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
            if (!day) return <View key={ci} style={cl.cell} />;
            const ds = dayStr(day);
            const cellDt = new Date(year, month, day);
            const isPast = cellDt < today;
            const isToday = ds === toDateStr(today);
            const isSel = ds === selected;
            return (
              <Pressable key={ci}
                onPress={() => { if (!isPast) { Haptics.selectionAsync(); onSelect(ds); } }}
                style={[
                  cl.cell,
                  isToday && !isSel && { backgroundColor: todayBg, borderRadius: 10 },
                  isSel && { backgroundColor: accentColor, borderRadius: 10 },
                ]}>
                <AppText style={[
                  cl.dayNum,
                  { color: isPast ? textDim : textPrimary },
                  isToday && !isSel && { color: accentColor, fontWeight: '700' },
                  isSel && { color: colors.white, fontWeight: '800' },
                ]}>{day}</AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const cl = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthLbl: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', paddingVertical: 5 },
  cell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 14, fontWeight: '500' },
});

// ─── AddReminderSheet ─────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (form: ReminderFormState) => void;
}

interface FormErrors { title?: string; weekdays?: string; }

export function AddReminderSheet({ visible, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const accentColor = colors.status.savings;

  const [form, setForm] = useState<ReminderFormState>(DEFAULT_REMINDER_FORM);
  const [timeState, setTimeState] = useState<TimeState>(parse24h(DEFAULT_REMINDER_FORM.time));
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync timeState → form.time (avoids nested setState anti-pattern)
  useEffect(() => {
    setForm((f) => ({ ...f, time: to24h(timeState.hour, timeState.minute, timeState.ampm) }));
  }, [timeState]);

  // Reset all state when sheet opens
  useEffect(() => {
    if (visible) {
      const todayStr = toDateStr(new Date());
      setForm({ ...DEFAULT_REMINDER_FORM, date: todayStr });
      setTimeState(parse24h(DEFAULT_REMINDER_FORM.time));
      setErrors({});
    }
  }, [visible]);

  const inputBg = colors.surface.input;
  const bdColor = colors.glass.border;
  const divider = colors.glass.background;

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.repeat === 'weekly' && form.weekdays.length === 0) errs.weekdays = 'true';
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }
    return true;
  }

  function handleSave() {
    if (validate()) onSave(form);
  }

  // Stepper handlers — stable closures, no captured stale state
  const incHour = () => { Haptics.selectionAsync(); setTimeState((t) => ({ ...t, hour: t.hour >= 12 ? 1 : t.hour + 1 })); };
  const decHour = () => { Haptics.selectionAsync(); setTimeState((t) => ({ ...t, hour: t.hour <= 1 ? 12 : t.hour - 1 })); };
  const incMin = () => { Haptics.selectionAsync(); setTimeState((t) => ({ ...t, minute: t.minute >= 59 ? 0 : t.minute + 1 })); };
  const decMin = () => { Haptics.selectionAsync(); setTimeState((t) => ({ ...t, minute: t.minute <= 0 ? 59 : t.minute - 1 })); };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>

        {/* Backdrop */}
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay.heavy }]} onPress={onClose} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.duration(320)}
          exiting={SlideOutDown.duration(240)}
          style={[s.sheet, { backgroundColor: colors.surface.sheet, shadowColor: colors.black }]}
        >
          {/* Drag handle */}
          <View style={[s.handle, { backgroundColor: colors.glass.backgroundStrong }]} />

          {/* Header */}
          <View style={s.header}>
            <LinearGradient
              colors={colors.gradients.purpleViolet as any}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.hdrIcon}
            >
              <Ionicons name="alarm" size={18} color={colors.white} />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSM" color={colors.text.primary}>Add Reminder</AppText>
              {form.title.trim() !== '' && (
                <AppText style={[s.hdrSub, { color: colors.text.tertiary }]}>
                  {formatDisplayTime(form.time)} · {REPEAT_OPTIONS.find((r) => r.value === form.repeat)?.label}
                </AppText>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={12}
              style={({ pressed }) => [s.closeBtn, {
                opacity: pressed ? 0.5 : 1,
                backgroundColor: colors.glass.backgroundMid,
              }]}>
              <Ionicons name="close" size={16} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Body + footer — keyboard-aware via KeyboardAvoidingSheet */}
          <KeyboardAvoidingSheet
            dividerColor={divider}
            footer={
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.82 : 1 }]}
              >
                <LinearGradient
                  colors={colors.gradients.purpleViolet as any}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.saveGrad}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  <AppText style={[s.saveTxt, { color: colors.white }]}>Save Reminder</AppText>
                </LinearGradient>
              </Pressable>
            }
          >
            {/* ── Title ─────────────────────────────────────────────── */}
            <View style={s.field}>
              <View style={s.fieldLblRow}>
                <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Title</AppText>
                <AppText style={{ color: colors.status.expense, fontSize: 13 }}> *</AppText>
              </View>
              <View style={[s.inputBox, {
                backgroundColor: inputBg,
                borderColor: errors.title
                  ? colors.status.expense
                  : form.title ? accentColor + '90' : bdColor,
              }]}>
                <TextInput
                  style={[s.input, { color: colors.text.primary }]}
                  value={form.title}
                  onChangeText={(v) => {
                    setForm((f) => ({ ...f, title: v }));
                    if (errors.title && v.trim()) setErrors((e) => ({ ...e, title: undefined }));
                  }}
                  placeholder="e.g. Check my budget"
                  placeholderTextColor={colors.text.tertiary}
                  returnKeyType="next"
                />
              </View>
              {errors.title && (
                <View style={s.errRow}>
                  <Ionicons name="alert-circle" size={13} color={colors.status.expense} />
                  <AppText style={[s.errTxt, { color: colors.status.expense }]}>{errors.title}</AppText>
                </View>
              )}
            </View>

            {/* ── Note ──────────────────────────────────────────────── */}
            <View style={s.field}>
              <View style={s.fieldLblRow}>
                <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Note</AppText>
                <AppText style={[s.fieldLbl, { color: colors.text.tertiary }]}> (optional)</AppText>
              </View>
              <View style={[s.inputBox, { backgroundColor: inputBg, borderColor: bdColor }]}>
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

            {/* ── Time picker ───────────────────────────────────────── */}
            <View style={s.field}>
              <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Time</AppText>
              <View style={[s.timeBox, { backgroundColor: inputBg, borderColor: bdColor }]}>
                <TimeStepper
                  label="HR"
                  display={String(timeState.hour).padStart(2, '0')}
                  onInc={incHour}
                  onDec={decHour}
                />
                <AppText style={[s.colon, { color: colors.text.primary }]}>:</AppText>
                <TimeStepper
                  label="MIN"
                  display={String(timeState.minute).padStart(2, '0')}
                  onInc={incMin}
                  onDec={decMin}
                />
                <View style={s.ampmWrap}>
                  <AmPmToggle
                    value={timeState.ampm}
                    onChange={(ampm) => setTimeState((t) => ({ ...t, ampm }))}
                  />
                </View>
              </View>
            </View>

            {/* ── Repeat ────────────────────────────────────────────── */}
            <View style={s.field}>
              <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Repeat</AppText>
              <View style={s.repeatGrid}>
                {REPEAT_OPTIONS.map(({ label, value, icon }) => {
                  const active = form.repeat === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setForm((f) => ({ ...f, repeat: value }));
                        if (errors.weekdays) setErrors((e) => ({ ...e, weekdays: undefined }));
                      }}
                      style={[s.repeatChip, {
                        backgroundColor: active ? accentColor + '18' : inputBg,
                        borderColor: active ? accentColor : bdColor,
                      }]}
                    >
                      <Ionicons name={icon as any} size={14} color={active ? accentColor : colors.text.tertiary} />
                      <AppText style={[s.repeatLbl, {
                        color: active ? accentColor : colors.text.secondary,
                        fontWeight: active ? '700' : '600',
                      }]}>{label}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── Weekday selector (weekly) ──────────────────────────── */}
            {form.repeat === 'weekly' && (
              <View style={s.field}>
                <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Days</AppText>
                <WeekdaySelector
                  selected={form.weekdays}
                  onChange={(days) => {
                    setForm((f) => ({ ...f, weekdays: days }));
                    if (errors.weekdays && days.length > 0)
                      setErrors((e) => ({ ...e, weekdays: undefined }));
                  }}
                  hasError={!!errors.weekdays}
                />
              </View>
            )}

            {/* ── Date picker (once) ────────────────────────────────── */}
            {form.repeat === 'none' && (
              <View style={s.field}>
                <AppText style={[s.fieldLbl, { color: colors.text.secondary }]}>Date</AppText>
                <View style={[s.calBox, {
                  backgroundColor: colors.glass.background,
                  borderColor: bdColor,
                }]}>
                  <MiniCalendar
                    selected={form.date}
                    onSelect={(date) => setForm((f) => ({ ...f, date }))}
                  />
                </View>
              </View>
            )}

          </KeyboardAvoidingSheet>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'transparent' },

  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '92%',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },

  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  hdrIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hdrSub: { fontSize: 12, marginTop: 1 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  field: { gap: 9 },
  fieldLblRow: { flexDirection: 'row', alignItems: 'baseline' },
  fieldLbl: { fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },

  inputBox: { height: 50, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, justifyContent: 'center' },
  input: { fontSize: 15, fontWeight: '500', paddingVertical: 0 },

  errRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  errTxt: { fontSize: 12, fontWeight: '500' },

  timeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 20, borderWidth: 1.5, paddingVertical: 16, paddingHorizontal: 12, gap: 8,
  },
  colon: { fontSize: 36, fontWeight: '900', marginBottom: 24, letterSpacing: -2, lineHeight: 40 },
  ampmWrap: { marginLeft: 6 },

  repeatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  repeatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, height: 40, borderRadius: 12, borderWidth: 1.5,
    minWidth: '45%', flex: 1,
  },
  repeatLbl: { fontSize: 13 },

  calBox: { borderRadius: 18, borderWidth: 1.5, padding: 16 },

  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54 },
  saveTxt: { fontSize: 16, fontWeight: '800' },
});
