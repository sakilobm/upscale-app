import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing } from '@constants/Dimensions';
import type { LedgerDirection, LedgerEntry } from '@store/ledgerStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type SheetMode = 'add' | 'partial';

interface LedgerEntrySheetProps {
  visible:    boolean;
  mode:       SheetMode;
  editEntry?: LedgerEntry;
  onClose:    () => void;
  onAdd:      (data: {
    personName: string;
    direction:  LedgerDirection;
    totalAmount: number;
    currency:   string;
    note?:      string;
    dueDate?:   string;
  }) => void;
  onPartialReturn: (entryId: string, amount: number, note?: string) => void;
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export function LedgerEntrySheet({
  visible,
  mode,
  editEntry,
  onClose,
  onAdd,
  onPartialReturn,
}: LedgerEntrySheetProps) {
  const { colors, isDark } = useTheme();

  const [personName,  setPersonName]  = useState('');
  const [amount,      setAmount]      = useState('');
  const [direction,   setDirection]   = useState<LedgerDirection>('OWED_TO_ME');
  const [note,        setNote]        = useState('');
  const [dueDate,     setDueDate]     = useState('');

  const translateY  = useSharedValue(600);
  const backdropOp  = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOp.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 160, mass: 0.9 });
    } else {
      backdropOp.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(600, { damping: 20, stiffness: 180 });
    }
  }, [visible]);

  useEffect(() => {
    if (visible && mode === 'add') {
      setPersonName(''); setAmount(''); setNote(''); setDueDate('');
      setDirection('OWED_TO_ME');
    }
    if (visible && mode === 'partial') {
      setAmount(''); setNote('');
    }
  }, [visible, mode]);

  const sheetStyle   = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOp.value,
  }));

  const cardBg: [string, string] = isDark
    ? ['rgba(15, 21, 36, 0.98)', 'rgba(8, 12, 20, 1.0)']
    : ['rgba(255, 255, 255, 1.0)', 'rgba(245, 247, 250, 1.0)'];

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return;

    if (mode === 'add') {
      if (!personName.trim()) return;
      onAdd({
        personName: personName.trim(),
        direction,
        totalAmount: parsed,
        currency:   'USD',
        note:       note.trim() || undefined,
        dueDate:    dueDate.trim() || undefined,
      });
    } else if (mode === 'partial' && editEntry) {
      onPartialReturn(editEntry.id, parsed, note.trim() || undefined);
    }
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <BlurView
            intensity={isDark ? 60 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient colors={cardBg} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.sheetBorder, { borderColor: colors.glass.border }]} pointerEvents="none" />

          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '50' }]} />

          {/* Title */}
          <View style={styles.titleRow}>
            <AppText variant="headingSM" color={colors.text.primary}>
              {mode === 'add'
                ? 'New Ledger Entry'
                : `Partial Return — ${editEntry?.personName}`}
            </AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'add' && (
              <>
                <Field label="Person Name" icon="person-outline" colors={colors} isDark={isDark}>
                  <TextInput
                    style={[styles.input, { color: colors.text.primary }]}
                    value={personName}
                    onChangeText={setPersonName}
                    placeholder="e.g. Marcus Chen"
                    placeholderTextColor={colors.text.tertiary}
                    autoCapitalize="words"
                  />
                </Field>

                {/* Direction toggle */}
                <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
                  Direction
                </AppText>
                <View style={styles.dirRow}>
                  {(['OWED_TO_ME', 'I_OWE'] as LedgerDirection[]).map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDirection(d)}
                      style={[
                        styles.dirBtn,
                        {
                          backgroundColor: direction === d
                            ? (d === 'OWED_TO_ME' ? colors.status.income : colors.status.expense) + '28'
                            : colors.glass.background,
                          borderColor: direction === d
                            ? (d === 'OWED_TO_ME' ? colors.status.income : colors.status.expense) + '55'
                            : colors.glass.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={d === 'OWED_TO_ME' ? 'arrow-down' : 'arrow-up'}
                        size={14}
                        color={direction === d
                          ? (d === 'OWED_TO_ME' ? colors.status.income : colors.status.expense)
                          : colors.text.secondary}
                      />
                      <AppText
                        variant="labelSM"
                        style={{
                          color: direction === d
                            ? (d === 'OWED_TO_ME' ? colors.status.income : colors.status.expense)
                            : colors.text.secondary,
                          fontSize: 12,
                        }}
                      >
                        {d === 'OWED_TO_ME' ? 'Owed to me' : 'I owe'}
                      </AppText>
                    </Pressable>
                  ))}
                </View>

                <Field label="Due Date (optional)" icon="calendar-outline" colors={colors} isDark={isDark}>
                  <TextInput
                    style={[styles.input, { color: colors.text.primary }]}
                    value={dueDate}
                    onChangeText={setDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.text.tertiary}
                    keyboardType="numbers-and-punctuation"
                  />
                </Field>
              </>
            )}

            <Field label="Amount (USD)" icon="cash-outline" colors={colors} isDark={isDark}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </Field>

            <Field label="Note (optional)" icon="chatbubble-outline" colors={colors} isDark={isDark}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Dinner split"
                placeholderTextColor={colors.text.tertiary}
                autoCapitalize="sentences"
              />
            </Field>
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor: colors.brand.primary,
                opacity:         pressed ? 0.82 : 1,
              },
            ]}
          >
            <AppText
              variant="labelLG"
              style={{
                color:      isDark ? colors.text.inverse : '#000',
                fontWeight: '700',
              }}
            >
              {mode === 'add' ? 'Save Entry' : 'Record Return'}
            </AppText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, icon, children, colors, isDark,
}: {
  label:    string;
  icon:     React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  colors:   any;
  isDark:   boolean;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
        {label}
      </AppText>
      <View
        style={[
          styles.fieldBox,
          {
            backgroundColor: isDark ? colors.glass.background : colors.background.tertiary,
            borderColor:     colors.glass.border,
          },
        ]}
      >
        <Ionicons name={icon} size={16} color={colors.text.tertiary} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    justifyContent:  'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    overflow:             'hidden',
    paddingHorizontal:    Spacing['5'],
    paddingBottom:        Platform.OS === 'ios' ? 40 : 28,
  },
  sheetBorder: {
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth:          1,
    borderBottomWidth:    0,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginTop:    12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: Spacing['4'],
  },
  form: {
    gap: Spacing['3'],
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize:      12,
    letterSpacing: 0.3,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
    paddingHorizontal: Spacing['3'],
    height:        48,
    borderRadius:  Radius.lg,
    borderWidth:   1,
  },
  input: {
    flex:     1,
    fontSize: 15,
  },
  dirRow: {
    flexDirection: 'row',
    gap:           Spacing['3'],
  },
  dirBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    height:         44,
    borderRadius:   Radius.lg,
    borderWidth:    1,
  },
  submitBtn: {
    height:         54,
    borderRadius:   Radius.xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      Spacing['5'],
  },
});
