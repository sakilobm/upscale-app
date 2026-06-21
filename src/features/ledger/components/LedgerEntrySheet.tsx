import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { ToastContainer } from '@components/Toast';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { DatePickerField } from '@components/DatePickerField';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { Radius, Spacing } from '@constants/Dimensions';
import type { LedgerDirection, LedgerEntry } from '@store/ledgerStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type SheetMode = 'add' | 'partial';

interface LedgerEntrySheetProps {
  visible:    boolean;
  mode:       SheetMode;
  editEntry?: LedgerEntry;
  defaultDirection?: LedgerDirection;
  onClose:    () => void;
  onAdd:      (data: {
    personName: string;
    direction:  LedgerDirection;
    totalAmount: number;
    currency:   string;
    note?:      string;
    dueDate?:   string;
    accountId:  string;
  }) => void;
  onPartialReturn: (entryId: string, amount: number, accountId: string, note?: string) => void;
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export function LedgerEntrySheet({
  visible,
  mode,
  editEntry,
  defaultDirection = 'OWED_TO_ME',
  onClose,
  onAdd,
  onPartialReturn,
}: LedgerEntrySheetProps) {
  const { colors, isDark } = useTheme();
  const { currency: userCurrency } = useFormatCurrency();
  const accounts = useAccountStore((s) => s.accounts);

  const [personName,  setPersonName]  = useState('');
  const [amount,      setAmount]      = useState('');
  const [direction,   setDirection]   = useState<LedgerDirection>('OWED_TO_ME');
  const [note,        setNote]        = useState('');
  const [dueDate,     setDueDate]     = useState('');
  const [accountId,   setAccountId]   = useState('');
  const [error,       setError]       = useState<string | null>(null);

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
      setDirection(defaultDirection);
      const defaultId = (accounts.find((a) => a.isDefault) ?? accounts[0])?.id ?? '';
      setAccountId(defaultId);
      setError(null);
    }
    if (visible && mode === 'partial') {
      setAmount(''); setNote('');
      const defaultId = editEntry?.accountId ?? (accounts.find((a) => a.isDefault) ?? accounts[0])?.id ?? '';
      setAccountId(defaultId);
      setError(null);
    }
  }, [visible, mode, editEntry, accounts]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  const cardBg: [string, string] = [
    colors.background.secondary,
    colors.background.primary,
  ];

  const handleSubmit = () => {
    setError(null);
    const parsed = parseFloat(amount);
    if (mode === 'add') {
      if (!personName.trim()) { setError('Person name is required'); return; }
    }
    if (isNaN(parsed) || parsed <= 0) { setError('Enter a valid amount'); return; }
    if (!accountId) { setError('Select an account'); return; }

    if (mode === 'add') {
      onAdd({
        personName: personName.trim(),
        direction,
        totalAmount: parsed,
        currency:   userCurrency,
        note:       note.trim() || undefined,
        dueDate:    dueDate.trim() || undefined,
        accountId,
      });
    } else if (mode === 'partial' && editEntry) {
      onPartialReturn(editEntry.id, parsed, accountId, note.trim() || undefined);
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
      <View style={styles.root}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle, { backgroundColor: colors.overlay.heavy }]} />
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
            {error && (
              <View style={[styles.errorBanner, { backgroundColor: colors.status.expense + '12', borderColor: colors.status.expense + '30' }]}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.status.expense} />
                <AppText style={[styles.errorText, { color: colors.status.expense }]}>{error}</AppText>
              </View>
            )}

            {mode === 'add' && (
              <>
                <Field label="Person Name" icon="person-outline" colors={colors} isDark={isDark}>
                  <TextInput
                    style={[styles.input, { color: colors.text.primary }]}
                    value={personName}
                    onChangeText={(val) => { setPersonName(val); setError(null); }}
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
                      onPress={() => { setDirection(d); setError(null); }}
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

                {/* Due Date — calendar picker */}
                <DatePickerField
                  label="Due Date (optional)"
                  value={dueDate}
                  onChange={(val) => { setDueDate(val); setError(null); }}
                  placeholder="Pick a due date"
                />
              </>
            )}

            <Field label={`Amount (${userCurrency})`} icon="cash-outline" colors={colors} isDark={isDark}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={amount}
                onChangeText={(val) => { setAmount(val); setError(null); }}
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
              />
            </Field>

            {/* Account Selector */}
            <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
              Account
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountScroll}>
              {accounts.map((acc) => {
                const active = accountId === acc.id;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => { setAccountId(acc.id); setError(null); Haptics.selectionAsync().catch(() => {}); }}
                    style={[
                      styles.accountChip,
                      {
                        backgroundColor: active ? acc.color + '1A' : colors.surface.input,
                        borderColor: active ? acc.color + '55' : colors.glass.border,
                        borderWidth: active ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: acc.color + '22' }]}>
                      <Ionicons name={acc.icon as any} size={13} color={acc.color} />
                    </View>
                    <AppText
                      variant="labelSM"
                      style={{ color: active ? acc.color : colors.text.secondary, fontWeight: active ? '700' : '500', fontSize: 12 }}
                    >
                      {acc.name}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Field label="Note (optional)" icon="chatbubble-outline" colors={colors} isDark={isDark}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={note}
                onChangeText={(val) => { setNote(val); setError(null); }}
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
              { backgroundColor: colors.brand.primary, opacity: pressed ? 0.82 : 1 },
            ]}
          >
            <AppText
              variant="labelLG"
              style={{ color: colors.brand.onPrimary, fontWeight: '700' }}
            >
              {mode === 'add' ? 'Save Entry' : 'Record Return'}
            </AppText>
          </Pressable>
          <ToastContainer isModal />
        </Animated.View>
      </View>
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
            backgroundColor: colors.surface.input,
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
    flex:           1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
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
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
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
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing['2'],
    paddingHorizontal: Spacing['3'],
    height:            48,
    borderRadius:      Radius.lg,
    borderWidth:       1,
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
  accountScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  accountIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    height:         54,
    borderRadius:   Radius.xl,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      Spacing['5'],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
