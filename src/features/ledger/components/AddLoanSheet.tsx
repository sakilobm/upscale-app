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
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import type { Loan, LoanType } from '@store/loansStore';
import { addMonths, format, parseISO } from 'date-fns';

const { height: SH } = Dimensions.get('window');

const LOAN_COLORS = [
  '#3B82F6', // Indigo Blue
  '#10B981', // Emerald Green
  '#8B5CF6', // Violet Purple
  '#F59E0B', // Amber Yellow
  '#EF4444', // Coral Rose
  '#06B6D4', // Cyan Wave
];

interface AddLoanSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (loan: Omit<Loan, 'id' | 'amountPaid' | 'completedPayments'>, postPrincipal?: boolean) => void;
  editLoan?: Loan;
  onEdit?: (loanId: string, updates: Partial<Loan>) => void;
}

export function AddLoanSheet({ visible, onClose, onAdd, editLoan, onEdit }: AddLoanSheetProps) {
  const { colors, isDark } = useTheme();
  const { currency } = useFormatCurrency();
  const insets = useSafeAreaInsets();
  const accounts = useAccountStore((s) => s.accounts);

  const [name, setName] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [type, setType] = useState<LoanType>('BORROWED');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [emi, setEmi] = useState('');
  const [totalPayments, setTotalPayments] = useState('12');
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedColor, setSelectedColor] = useState(LOAN_COLORS[0]);
  const [accountId, setAccountId] = useState('');
  const [postPrincipal, setPostPrincipal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translateY = useSharedValue(600);
  const backdropOp = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOp.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 160, mass: 0.9 });
      
      if (editLoan) {
        setName(editLoan.name);
        setCounterparty(editLoan.counterparty);
        setType(editLoan.type);
        setPrincipal(editLoan.principalAmount.toString());
        setInterestRate(editLoan.interestRate.toString());
        setEmi(editLoan.emiAmount.toString());
        setTotalPayments(editLoan.totalPayments.toString());
        setStartDate(editLoan.startDate);
        setSelectedColor(editLoan.color);
        setAccountId(editLoan.accountId ?? '');
        setPostPrincipal(false);
        setError(null);
      } else {
        // Reset form
        setName('');
        setCounterparty('');
        setType('BORROWED');
        setPrincipal('');
        setInterestRate('0');
        setEmi('');
        setTotalPayments('12');
        setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setSelectedColor(LOAN_COLORS[0]);
        const defaultId = (accounts.find((a) => a.isDefault) ?? accounts[0])?.id ?? '';
        setAccountId(defaultId);
        setPostPrincipal(false);
        setError(null);
      }
    } else {
      backdropOp.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(600, { damping: 20, stiffness: 180 });
    }
  }, [visible, editLoan, accounts]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) { setError('Loan name is required'); return; }
    if (!counterparty.trim()) { setError(type === 'BORROWED' ? 'Lender name is required' : 'Borrower name is required'); return; }
    
    const parsedPrincipal = parseFloat(principal);
    if (isNaN(parsedPrincipal) || parsedPrincipal <= 0) { setError('Enter a valid principal amount'); return; }
    
    const parsedInterest = parseFloat(interestRate);
    if (isNaN(parsedInterest) || parsedInterest < 0) { setError('Enter a valid interest rate'); return; }
    
    const parsedEmi = parseFloat(emi);
    if (isNaN(parsedEmi) || parsedEmi <= 0) { setError('Enter a valid EMI installment amount'); return; }
    
    const parsedPayments = parseInt(totalPayments, 10);
    if (isNaN(parsedPayments) || parsedPayments <= 0) { setError('Enter a valid payments count'); return; }
    
    if (!startDate) { setError('Select a start date'); return; }

    // Calculate next payment date as 1 month from start date
    let nextPaymentDate = startDate;
    try {
      nextPaymentDate = format(addMonths(parseISO(startDate), 1), 'yyyy-MM-dd');
    } catch (e) {
      nextPaymentDate = startDate;
    }

    if (editLoan && onEdit) {
      onEdit(editLoan.id, {
        name: name.trim(),
        counterparty: counterparty.trim(),
        type,
        principalAmount: parsedPrincipal,
        interestRate: parsedInterest,
        emiAmount: parsedEmi,
        totalPayments: parsedPayments,
        startDate,
        color: selectedColor,
        accountId,
      });
    } else {
      onAdd({
        name: name.trim(),
        counterparty: counterparty.trim(),
        type,
        principalAmount: parsedPrincipal,
        interestRate: parsedInterest,
        startDate,
        nextPaymentDate,
        emiAmount: parsedEmi,
        totalPayments: parsedPayments,
        color: selectedColor,
        accountId,
      }, postPrincipal);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
    onClose();
  };

  const sheetBg: [string, string] = [
    colors.background.secondary,
    colors.background.primary,
  ];

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
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            sheetStyle,
          ]}
        >
          <BlurView
            intensity={isDark ? 60 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient colors={sheetBg} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.sheetBorder, { borderColor: colors.glass.border }]} pointerEvents="none" />

          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '50' }]} />

          {/* Title */}
          <View style={styles.titleRow}>
            <AppText variant="headingSM" color={colors.text.primary}>
              {editLoan ? 'Edit Loan Contract' : 'Add New Loan'}
            </AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.status.expense + '12', borderColor: colors.status.expense + '30' }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.expense} />
              <AppText style={[styles.errorText, { color: colors.status.expense }]}>{error}</AppText>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            style={styles.keyboardContainer}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Loan Type toggle */}
              <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
                Loan Type
              </AppText>
              <View style={styles.dirRow}>
                <Pressable
                  onPress={() => { setType('BORROWED'); setError(null); }}
                  style={[
                    styles.dirBtn,
                    {
                      backgroundColor: type === 'BORROWED' ? colors.status.expense + '1A' : colors.glass.background,
                      borderColor: type === 'BORROWED' ? colors.status.expense + '55' : colors.glass.border,
                    },
                  ]}
                >
                  <Ionicons name="arrow-down-outline" size={14} color={type === 'BORROWED' ? colors.status.expense : colors.text.secondary} />
                  <AppText variant="labelSM" style={{ color: type === 'BORROWED' ? colors.status.expense : colors.text.secondary, fontWeight: '700' }}>
                    Borrowed (You owe)
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => { setType('LENT'); setError(null); }}
                  style={[
                    styles.dirBtn,
                    {
                      backgroundColor: type === 'LENT' ? colors.status.income + '1A' : colors.glass.background,
                      borderColor: type === 'LENT' ? colors.status.income + '55' : colors.glass.border,
                    },
                  ]}
                >
                  <Ionicons name="arrow-up-outline" size={14} color={type === 'LENT' ? colors.status.income : colors.text.secondary} />
                  <AppText variant="labelSM" style={{ color: type === 'LENT' ? colors.status.income : colors.text.secondary, fontWeight: '700' }}>
                    Lent (They owe)
                  </AppText>
                </Pressable>
              </View>

              {/* Loan Name */}
              <Field label="Loan Name" icon="ribbon-outline" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={name}
                  onChangeText={(val) => { setName(val); setError(null); }}
                  placeholder="e.g. Car Loan, Home Mortgage"
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="words"
                />
              </Field>

              {/* Counterparty */}
              <Field label={type === 'BORROWED' ? 'Lender Name' : 'Borrower Name'} icon="person-outline" colors={colors}>
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={counterparty}
                  onChangeText={(val) => { setCounterparty(val); setError(null); }}
                  placeholder={type === 'BORROWED' ? "e.g. Chase Bank, Dad" : "e.g. Samuel Green"}
                  placeholderTextColor={colors.text.tertiary}
                  autoCapitalize="words"
                />
              </Field>

              {/* Principal and Interest rate side-by-side */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1.2 }}>
                  <Field label={`Principal (${currency})`} icon="cash-outline" colors={colors}>
                    <TextInput
                      style={[styles.input, { color: colors.text.primary }]}
                      value={principal}
                      onChangeText={(val) => { setPrincipal(val); setError(null); }}
                      placeholder="e.g. 15000"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                  </Field>
                </View>
                <View style={{ flex: 0.8 }}>
                  <Field label="Interest Rate (%)" icon="trending-up-outline" colors={colors}>
                    <TextInput
                      style={[styles.input, { color: colors.text.primary }]}
                      value={interestRate}
                      onChangeText={(val) => { setInterestRate(val); setError(null); }}
                      placeholder="e.g. 5.5"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                  </Field>
                </View>
              </View>

              {/* Monthly EMI and Total Payments side-by-side */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Field label={`Monthly EMI (${currency})`} icon="wallet-outline" colors={colors}>
                    <TextInput
                      style={[styles.input, { color: colors.text.primary }]}
                      value={emi}
                      onChangeText={(val) => { setEmi(val); setError(null); }}
                      placeholder="e.g. 450"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="decimal-pad"
                    />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Total Installments" icon="repeat-outline" colors={colors}>
                    <TextInput
                      style={[styles.input, { color: colors.text.primary }]}
                      value={totalPayments}
                      onChangeText={(val) => { setTotalPayments(val); setError(null); }}
                      placeholder="e.g. 36"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="number-pad"
                    />
                  </Field>
                </View>
              </View>

              {/* Start Date */}
              <DatePickerField
                label="Start Date"
                value={startDate}
                onChange={(val) => { setStartDate(val); setError(null); }}
                placeholder="Pick loan start date"
              />

              {/* Account Selector (Only during initial Creation) */}
              {!editLoan && accounts.length > 0 && (
                <>
                  <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
                    Link to Account (for tracking)
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

                  {/* Post Principal checkbox */}
                  <Pressable
                    onPress={() => { setPostPrincipal(!postPrincipal); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); }}
                    style={styles.checkboxRow}
                  >
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: postPrincipal ? colors.brand.primary : colors.glass.border,
                        backgroundColor: postPrincipal ? colors.brand.primary : colors.surface.input,
                      }
                    ]}>
                      {postPrincipal && <Ionicons name="checkmark" size={12} color={colors.brand.onPrimary} />}
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <AppText variant="labelSM" color={colors.text.primary} style={{ fontWeight: '600' }}>
                        Post principal to account balance
                      </AppText>
                      <AppText variant="caption" color={colors.text.tertiary}>
                        {type === 'BORROWED'
                          ? 'Adds principal amount to account balance as income'
                          : 'Deducts principal amount from account balance as expense'}
                      </AppText>
                    </View>
                  </Pressable>
                </>
              )}

              {/* Color Picker theme */}
              <AppText variant="labelSM" color={colors.text.secondary} style={styles.fieldLabel}>
                Visual Card Theme
              </AppText>
              <View style={styles.colorRow}>
                {LOAN_COLORS.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => { setSelectedColor(c); Haptics.selectionAsync().catch(() => { }); }}
                      style={[
                        styles.colorChip,
                        { backgroundColor: c },
                        isSelected && { transform: [{ scale: 1.1 }] },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Submit */}
              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.brand.primary, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <AppText variant="labelLG" style={{ color: colors.brand.onPrimary, fontWeight: '700' }}>
                  {editLoan ? 'Save Changes' : 'Create Loan Contract'}
                </AppText>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
          <ToastContainer isModal />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label, icon, children, colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  colors: any;
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
            borderColor: colors.glass.border,
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    overflow: 'hidden',
    paddingHorizontal: Spacing['5'],
    maxHeight: SH * 0.9,
  },
  sheetBorder: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing['4'],
  },
  keyboardContainer: {
    width: '100%',
  },
  formScroll: {
    gap: Spacing['4'],
    paddingBottom: 80,
  },
  fieldWrapper: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['3'],
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  dirRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  dirBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  colorChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    height: 54,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['4'],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    marginTop: 4,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
