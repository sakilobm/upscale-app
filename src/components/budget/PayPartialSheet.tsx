import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Modal, TextInput,
  Platform, Pressable, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAvoidingSheet } from '@components/KeyboardAvoidingSheet';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { Spacing, Radius } from '@constants/index';
import type { PlannedPayment } from '@store/plannedPaymentsStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  payment: PlannedPayment | null;
  onSubmit: (amount: number, accountId: string, note?: string) => void;
}

export function PayPartialSheet({ visible, onClose, payment, onSubmit }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const accounts = useAccountStore((s) => s.accounts);

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (payment) {
      const remaining = payment.amount - (payment.amountPaid ?? 0);
      setAmount(remaining.toFixed(2));
      setAccountId(payment.accountId || accounts[0]?.id || '');
      setNote('');
      setError(null);
      setIsSaving(false);
    }
  }, [payment, visible]);

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));

  const handleShow = () => { scale.value = withSpring(1, { damping: 18, stiffness: 220 }); };
  const handleHide = () => { scale.value = withSpring(0.86, { damping: 18, stiffness: 220 }); };

  const handleSubmit = () => {
    if (isSaving) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (payment && val > (payment.amount - (payment.amountPaid ?? 0)) + 0.01) {
      setError(`Amount exceeds remaining balance of ${symbol}${(payment.amount - (payment.amountPaid ?? 0)).toFixed(2)}`);
      return;
    }
    if (!accountId) {
      setError('Please select an account');
      return;
    }
    
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    setTimeout(() => {
      onSubmit(val, accountId, note || undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setIsSaving(false);
      onClose();
    }, 600);
  };

  if (!payment) return null;

  const cardBg = colors.surface.sheet;
  const inputBg = colors.surface.input;
  const dividerC = colors.glass.background;
  const remaining = payment.amount - (payment.amountPaid ?? 0);

  return (
    <Modal
      visible={visible} transparent animationType="none"
      onRequestClose={onClose} onShow={handleShow} onDismiss={handleHide}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <BlurView intensity={isDark ? 40 : 30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay.medium }]} />
      </Pressable>

      <View style={s.outer} pointerEvents="box-none">
        <Animated.View style={[s.sheet, sheetStyle, { backgroundColor: cardBg, shadowColor: colors.black }]}>
          <View style={[s.handle, { backgroundColor: colors.text.tertiary + '35' }]} />

          <View style={s.header}>
            <View>
              <AppText variant="headingMD" color={colors.text.primary}>Record Spend</AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 2 }}>
                Log a partial payment for "{payment.title}"
              </AppText>
            </View>
            <Pressable onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.glass.backgroundMid }]}>
              <Ionicons name="close" size={17} color={colors.text.secondary} />
            </Pressable>
          </View>

          <KeyboardAvoidingSheet
            dividerColor={dividerC}
            contentStyle={s.body}
            footer={
              <Pressable
                onPress={handleSubmit}
                disabled={isSaving}
                style={({ pressed }) => [
                  s.submitBtn,
                  {
                    backgroundColor: colors.brand.primary,
                    opacity: isSaving ? 0.6 : (pressed ? 0.8 : 1),
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.brand.onPrimary} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={colors.brand.onPrimary} />
                    <AppText style={[s.submitBtnText, { color: colors.brand.onPrimary }]}>Record Payment</AppText>
                  </>
                )}
              </Pressable>
            }
          >
            <View style={{ opacity: isSaving ? 0.65 : 1 }} pointerEvents={isSaving ? 'none' : 'auto'}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.form}>
                
                {/* Error box */}
                {!!error && (
                  <View style={[s.errorBox, { backgroundColor: colors.status.expense + '15', borderColor: colors.status.expense + '30' }]}>
                    <Ionicons name="alert-circle" size={16} color={colors.status.expense} />
                    <AppText variant="caption" style={{ color: colors.status.expense, fontWeight: '600', flex: 1 }}>{error}</AppText>
                  </View>
                )}

                {/* Status info */}
                <View style={[s.infoBox, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
                  <View style={s.infoRow}>
                    <AppText variant="caption" color={colors.text.tertiary}>Total Budget:</AppText>
                    <AppText variant="labelSM" color={colors.text.primary}>{symbol}{payment.amount.toFixed(2)}</AppText>
                  </View>
                  <View style={s.infoRow}>
                    <AppText variant="caption" color={colors.text.tertiary}>Already Paid/Spent:</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="remove" size={12} color={colors.status.expense} style={{ fontWeight: '800' }} />
                      <AppText variant="labelSM" color={colors.status.expense} style={{ fontWeight: '700' }}>
                        {symbol}{(payment.amountPaid ?? 0).toFixed(2)}
                      </AppText>
                    </View>
                  </View>
                  <View style={[s.divider, { backgroundColor: colors.glass.border }]} />
                  <View style={s.infoRow}>
                    <AppText variant="labelSM" color={colors.text.secondary}>Remaining Balance:</AppText>
                    <AppText variant="labelLG" color={colors.text.primary} style={{ fontWeight: '700' }}>{symbol}{remaining.toFixed(2)}</AppText>
                  </View>
                </View>

                {/* Input Amount */}
                <View style={s.inputGroup}>
                  <AppText variant="labelSM" color={colors.text.secondary}>Payment Amount</AppText>
                  <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: colors.glass.border }]}>
                    <AppText style={[s.symbolText, { color: colors.text.tertiary }]}>{symbol}</AppText>
                    <TextInput
                      style={[s.input, { color: colors.text.primary }]}
                      keyboardType="decimal-pad"
                      value={amount}
                      onChangeText={(val) => { setAmount(val); setError(null); }}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.tertiary}
                    />
                  </View>
                  
                  {/* Live progress preview bar */}
                  {payment.amount > 0 && (() => {
                    const typedVal = parseFloat(amount) || 0;
                    const paidPaid = payment.amountPaid ?? 0;
                    const totalSpendProj = paidPaid + typedVal;
                    const isOverBudget = totalSpendProj > payment.amount;
                    const paidPct = (paidPaid / payment.amount) * 100;
                    const typedPct = (typedVal / payment.amount) * 100;
                    return (
                      <View style={{ marginTop: 6, gap: 4 }}>
                        <View style={[s.liveProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                          {paidPaid > 0 && (
                            <View style={[s.liveProgressSegment, { width: `${paidPct}%`, backgroundColor: colors.text.tertiary + '80' }]} />
                          )}
                          {typedVal > 0 && (
                            <View style={[s.liveProgressSegment, { width: `${Math.min(typedPct, 100 - paidPct)}%`, backgroundColor: isOverBudget ? colors.status.expense : '#10B981' }]} />
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <AppText variant="caption" color={colors.text.tertiary} style={{ fontSize: 9 }}>
                            Proj. Total: {symbol}{totalSpendProj.toFixed(2)}
                          </AppText>
                          <AppText 
                            variant="caption" 
                            style={{ 
                              fontSize: 9, 
                              color: isOverBudget ? colors.status.expense : colors.status.income, 
                              fontWeight: '700' 
                            }}
                          >
                            {isOverBudget 
                              ? `Over Budget by ${symbol}${(totalSpendProj - payment.amount).toFixed(2)}!` 
                              : `${((totalSpendProj / payment.amount) * 100).toFixed(0)}% Completed`}
                          </AppText>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                {/* Select Account */}
                <View style={s.inputGroup}>
                  <AppText variant="labelSM" color={colors.text.secondary}>Pay From Account</AppText>
                  <View style={s.accountList}>
                    {accounts.map((acc) => {
                      const active = accountId === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => { setAccountId(acc.id); setError(null); }}
                          style={[
                            s.accountItem,
                            {
                              borderColor: active ? acc.color : colors.glass.border,
                              backgroundColor: active ? acc.color + '15' : 'transparent',
                            },
                          ]}
                        >
                          <Ionicons name={acc.icon as any} size={15} color={active ? acc.color : colors.text.secondary} />
                          <AppText
                            variant="caption"
                            style={{
                              color: active ? acc.color : colors.text.secondary,
                              fontWeight: '700',
                            }}
                          >
                            {acc.name}
                          </AppText>
                          <AppText variant="caption" color={colors.text.tertiary}>
                            {symbol}{acc.balance.toFixed(0)}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Optional Note */}
                <View style={s.inputGroup}>
                  <AppText variant="labelSM" color={colors.text.secondary}>Note (Optional)</AppText>
                  <TextInput
                    style={[s.textInput, { backgroundColor: inputBg, borderColor: colors.glass.border, color: colors.text.primary }]}
                    placeholder="e.g. Paid first installment"
                    placeholderTextColor={colors.text.tertiary}
                    value={note}
                    onChangeText={setNote}
                  />
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingSheet>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1,
    borderColor: 'transparent',
    maxHeight: '90%',
  },
  handle: { width: 38, height: 4.5, borderRadius: 3, alignSelf: 'center', marginTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    paddingBottom: Spacing['3'],
  },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: Spacing['5'], paddingBottom: Spacing['5'] },
  form: { gap: Spacing['4'], paddingTop: Spacing['2'] },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing['3'],
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  infoBox: {
    padding: Spacing['4'],
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  inputGroup: { gap: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing['4'],
  },
  symbolText: { fontSize: 16, fontWeight: '700', marginRight: 4 },
  input: { flex: 1, fontSize: 16, fontWeight: '600', padding: 0 },
  textInput: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing['4'],
    fontSize: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700' },
  accountList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  liveProgressTrack: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  liveProgressSegment: {
    height: 6,
  },
});
