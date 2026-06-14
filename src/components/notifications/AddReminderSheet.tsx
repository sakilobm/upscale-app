import { useState, useEffect } from 'react';
import {
  View, StyleSheet, Pressable, TextInput, Modal,
  ScrollView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import type { ReminderFormState } from '@features/notifications/hooks/useNotificationsScreen';
import { DEFAULT_REMINDER_FORM } from '@features/notifications/hooks/useNotificationsScreen';
import type { RepeatInterval } from '@store/notificationStore';

const { width: SW } = Dimensions.get('window');

const TIME_PRESETS: { label: string; value: string }[] = [
  { label: '7:00 AM',  value: '07:00' },
  { label: '9:00 AM',  value: '09:00' },
  { label: '12:00 PM', value: '12:00' },
  { label: '3:00 PM',  value: '15:00' },
  { label: '6:00 PM',  value: '18:00' },
  { label: '9:00 PM',  value: '21:00' },
];

const REPEAT_OPTIONS: { label: string; value: RepeatInterval }[] = [
  { label: 'Once',    value: 'none'    },
  { label: 'Daily',   value: 'daily'   },
  { label: 'Weekly',  value: 'weekly'  },
  { label: 'Monthly', value: 'monthly' },
];

interface Props {
  visible:  boolean;
  onClose:  () => void;
  onSave:   (form: ReminderFormState) => void;
}

export function AddReminderSheet({ visible, onClose, onSave }: Props) {
  const { colors, isDark } = useTheme();
  const [form, setForm] = useState<ReminderFormState>(DEFAULT_REMINDER_FORM);

  useEffect(() => {
    if (visible) setForm(DEFAULT_REMINDER_FORM);
  }, [visible]);

  const inputBg     = isDark ? colors.background.secondary : '#F4F4F8';
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const accent      = '#8B5CF6';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        entering={SlideInDown.springify().damping(28).stiffness(220)}
        exiting={SlideOutDown.springify().damping(28).stiffness(220)}
        style={[s.sheet, { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' }]}
      >
        {/* Handle */}
        <View style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

        {/* Header */}
        <View style={s.sheetHeader}>
          <View style={[s.sheetIcon, { backgroundColor: accent + '18' }]}>
            <Ionicons name="alarm" size={18} color={accent} />
          </View>
          <AppText variant="headingSM" color={colors.text.primary}>Add Reminder</AppText>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.text.tertiary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={s.fieldBlock}>
            <AppText variant="labelMD" color={colors.text.secondary} style={s.label}>Title</AppText>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: form.title ? accent + '80' : inputBorder }]}>
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
          <View style={s.fieldBlock}>
            <AppText variant="labelMD" color={colors.text.secondary} style={s.label}>Note (optional)</AppText>
            <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
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

          {/* Time */}
          <View style={s.fieldBlock}>
            <AppText variant="labelMD" color={colors.text.secondary} style={s.label}>Time</AppText>
            <View style={s.chipGrid}>
              {TIME_PRESETS.map(({ label, value }) => {
                const active = form.time === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setForm((f) => ({ ...f, time: value }))}
                    style={[
                      s.chip,
                      {
                        backgroundColor: active ? accent + '18' : inputBg,
                        borderColor:     active ? accent + '80' : inputBorder,
                      },
                    ]}
                  >
                    <AppText style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? accent : colors.text.secondary }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Repeat */}
          <View style={s.fieldBlock}>
            <AppText variant="labelMD" color={colors.text.secondary} style={s.label}>Repeat</AppText>
            <View style={s.repeatRow}>
              {REPEAT_OPTIONS.map(({ label, value }) => {
                const active = form.repeat === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setForm((f) => ({ ...f, repeat: value }))}
                    style={[
                      s.repeatChip,
                      {
                        backgroundColor: active ? accent : inputBg,
                        borderColor:     active ? accent : inputBorder,
                      },
                    ]}
                  >
                    <AppText style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.text.secondary }}>
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={[s.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
          <Pressable
            onPress={() => onSave(form)}
            style={({ pressed }) => [s.saveBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient colors={[accent, '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.saveGradient}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <AppText style={s.saveLbl}>Save Reminder</AppText>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '85%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 24 },
    }),
  },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  sheetIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 20, paddingBottom: 8, gap: 20 },
  fieldBlock: { gap: 10 },
  label: { letterSpacing: 0.3 },
  inputWrap: {
    height: 50, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  input: { fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    minWidth: (SW - 40 - 24) / 3,
  },
  repeatRow: { flexDirection: 'row', gap: 8 },
  repeatChip: {
    flex: 1, height: 38, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { borderTopWidth: 1, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
  saveLbl: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
