/**
 * @file EditTransactionSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Full-screen bottom-sheet for editing a transaction.
 *   Delegates form states and corrections to useEditTransaction.
 * @associatedFiles src/features/transactions/hooks/useEditTransaction.ts,
 *   src/app/(tabs)/index.tsx, src/app/(tabs)/transactions.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Platform, Dimensions, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEditTransaction } from '@features/transactions/hooks/useEditTransaction';
import { DatePickerField } from '@components/DatePickerField';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/index';
import { CURRENCY_SYMBOLS } from '@store/types';
import type { Transaction } from '@store/types';
import { router } from 'expo-router';
import { useTransactionStore } from '@store/transactionStore';

const { height: SH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}

export function EditTransactionSheet({ visible, transaction, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const { currency } = useFormatCurrency();
  const insets = useSafeAreaInsets();
  const [catFormVisible, setCatFormVisible] = useState(false);

  const {
    type, setType,
    amountStr, setAmountStr,
    category, setCategory,
    accountId, setAccountId,
    note, setNote,
    dateStr, setDateStr,
    cats, accounts, accentColor,
    handleSave,
  } = useEditTransaction(transaction, onClose);

  const slideY = useSharedValue(SH * 0.9);

  useEffect(() => {
    if (visible) {
      slideY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH * 0.9, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  const sheetBg = colors.background.secondary;
  const inputBg = colors.background.primary;

  const selectedAccountCurrency = accounts.find((a) => a.id === accountId)?.currency ?? currency;
  const currentSymbol = CURRENCY_SYMBOLS[selectedAccountCurrency] ?? '$';

  if (!transaction) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: colors.overlay.medium }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <Animated.View style={[s.sheet, { backgroundColor: sheetBg, shadowColor: colors.black, paddingBottom: insets.bottom + 8 }, sheetStyle]}>
            <View style={[s.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

            {/* Header */}
            <View style={s.header}>
              <AppText variant="headingSM" style={{ color: colors.text.primary, fontWeight: '800' }}>
                Edit Transaction
              </AppText>
              <Pressable onPress={onClose} hitSlop={12} style={[s.closeBtn, { backgroundColor: colors.glass.backgroundMid }]}>
                <Ionicons name="close" size={17} color={colors.text.secondary} />
              </Pressable>
            </View>

            {/* Type toggle */}
            <View style={[s.typeRow, { backgroundColor: colors.glass.backgroundMid }]}>
              {(['expense', 'income'] as const).map((t) => {
                const active = type === t;
                const tColor = t === 'expense' ? colors.status.expense : colors.status.income;
                return (
                  <Pressable
                    key={t}
                    onPress={() => { setType(t); Haptics.selectionAsync(); }}
                    style={[
                      s.typeBtn,
                      active && { backgroundColor: tColor + '1A', borderColor: tColor + '44', borderWidth: 1 },
                    ]}
                  >
                    <Ionicons
                      name={t === 'expense' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                      size={18}
                      color={active ? tColor : colors.text.tertiary}
                    />
                    <AppText
                      variant="labelMD"
                      style={{ color: active ? tColor : colors.text.tertiary, fontWeight: active ? '700' : '500' }}
                    >
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Amount */}
            <View style={s.amountSection}>
              <AppText variant="caption" style={{ color: colors.text.tertiary, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                AMOUNT ({selectedAccountCurrency})
              </AppText>
              <View style={s.amountInputRow}>
                <AppText style={[s.amountSymbol, { color: accentColor }]}>{currentSymbol}</AppText>
                <TextInput
                  style={[s.amountInputText, { color: accentColor }]}
                  value={amountStr}
                  onChangeText={setAmountStr}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={10}
                />
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">
              {/* Date & Time */}
              <View style={s.fieldGroup}>
                <DatePickerField
                  label="TRANSACTION DATE & TIME"
                  value={dateStr}
                  onChange={setDateStr}
                  placeholder="Select Date & Time"
                  showTime
                />
              </View>

              {/* Category */}
              <View style={s.fieldGroup}>
                <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary }]}>CATEGORY</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
                  {cats.map((catDef) => {
                    const active = category === catDef.id;
                    return (
                      <Pressable
                        key={catDef.id}
                        onPress={() => { setCategory(catDef.id); Haptics.selectionAsync(); }}
                        style={[
                          s.catChip,
                          {
                            backgroundColor: active ? catDef.color + '20' : inputBg,
                            borderColor: active ? catDef.color + '50' : 'transparent',
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <View style={[s.catIcon, { backgroundColor: catDef.color + '20' }]}>
                          <Ionicons name={catDef.icon as any} size={15} color={catDef.color} />
                        </View>
                        <AppText
                          variant="labelSM"
                          style={{
                            color: active ? catDef.color : colors.text.secondary,
                            fontWeight: active ? '700' : '500',
                            fontSize: 11,
                          }}
                        >
                          {catDef.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    onPress={() => { setCatFormVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={[s.catChip, s.catNewChip, { borderColor: (isDark ? colors.brand.primary : '#8EB41F') + '80' }]}
                  >
                    <View style={[s.catIcon, { backgroundColor: (isDark ? colors.brand.primary : '#8EB41F') + '22' }]}>
                      <Ionicons name="add" size={15} color={isDark ? colors.brand.primary : '#8EB41F'} />
                    </View>
                    <AppText variant="labelSM" style={{ color: isDark ? colors.brand.primary : '#8EB41F', fontWeight: '700', fontSize: 11 }}>
                      New
                    </AppText>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Account */}
              <View style={s.fieldGroup}>
                <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary }]}>ACCOUNT</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.accountScroll}>
                  {accounts.map((acc) => {
                    const active = accountId === acc.id;
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => { setAccountId(acc.id); Haptics.selectionAsync(); }}
                        style={[
                          s.accountChip,
                          {
                            backgroundColor: active ? acc.color + '1A' : inputBg,
                            borderColor: active ? acc.color + '55' : 'transparent',
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <View style={[s.accountIcon, { backgroundColor: acc.color + '22' }]}>
                          <Ionicons name={acc.icon as any} size={14} color={acc.color} />
                        </View>
                        <AppText
                          variant="labelSM"
                          style={{ color: active ? acc.color : colors.text.secondary, fontWeight: active ? '700' : '500' }}
                        >
                          {acc.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Note */}
              <View style={s.fieldGroup}>
                <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary }]}>NOTES</AppText>
                <TextInput
                  style={[
                    s.noteInput,
                    {
                      backgroundColor: inputBg,
                      color: colors.text.primary,
                      borderColor: colors.glass.border,
                    },
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={80}
                />
              </View>

              {/* Related Actions (Ledger & Budget) */}
              <View style={s.shortcutsSection}>
                <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary, marginBottom: 8 }]}>
                  RELATED ACTIONS
                </AppText>
                <View style={s.shortcutsRow}>
                  {/* Ledger Shortcut */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      useTransactionStore.getState().setFilters({
                        accountId: transaction.accountId,
                        type: 'all',
                        category: 'all',
                      });
                      onClose();
                      setTimeout(() => {
                        router.push('/(tabs)/transactions');
                      }, 100);
                    }}
                    style={({ pressed }) => [
                      s.shortcutBtn,
                      {
                        backgroundColor: isDark ? colors.glass.background : colors.background.primary,
                        borderColor: colors.glass.border,
                        opacity: pressed ? 0.75 : 1,
                      }
                    ]}
                  >
                    <Ionicons name="receipt-outline" size={16} color={colors.brand.primary} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <AppText variant="labelSM" style={{ color: colors.text.primary, fontWeight: '700' }}>
                        View Account Ledger
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.text.tertiary, fontSize: 10 }}>
                        Transactions for this account
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
                  </Pressable>

                  {/* Budget Shortcut */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onClose();
                      setTimeout(() => {
                        router.push('/(tabs)/budget');
                      }, 100);
                    }}
                    style={({ pressed }) => [
                      s.shortcutBtn,
                      {
                        backgroundColor: isDark ? colors.glass.background : colors.background.primary,
                        borderColor: colors.glass.border,
                        opacity: pressed ? 0.75 : 1,
                      }
                    ]}
                  >
                    <Ionicons name="pie-chart-outline" size={16} color={colors.status.warning} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <AppText variant="labelSM" style={{ color: colors.text.primary, fontWeight: '700' }}>
                        View Budgets
                      </AppText>
                      <AppText variant="caption" style={{ color: colors.text.tertiary, fontSize: 10 }}>
                        Monthly limits & progress
                      </AppText>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={colors.text.tertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Save button */}
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [s.addBtn, { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <AppText style={[s.addBtnText, { color: colors.white }]}>Save Changes</AppText>
              </Pressable>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>

      <CategoryFormSheet
        visible={catFormVisible}
        onClose={() => setCatFormVisible(false)}
        onSaved={(id) => setCategory(id)}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8, paddingHorizontal: 16,
    maxHeight: SH * 0.9,
    ...Platform.select({
      ios: { shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', borderRadius: Radius.xl, padding: 4, marginBottom: 16, gap: 4 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.lg },
  amountSection: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  amountSymbol: { fontSize: 32, fontWeight: '800' },
  amountInputText: { fontSize: 36, fontWeight: '800', textAlign: 'center', minWidth: 100, paddingVertical: 0 },
  formScroll: { gap: 16, paddingBottom: 24 },
  fieldGroup: { gap: 6 },
  sectionLabel: { letterSpacing: 1, fontSize: 10, fontWeight: '700', marginBottom: 4, marginLeft: 2 },
  catScroll: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  catNewChip: { borderWidth: 1.5, borderStyle: 'dashed' },
  catIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accountScroll: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full },
  accountIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteInput: { height: 48, borderRadius: Radius.lg, paddingHorizontal: 14, fontSize: 14, borderWidth: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: Radius.lg, marginTop: 12 },
  addBtnText: { fontWeight: '700', fontSize: 16 },
  shortcutsSection: { marginTop: 8, marginBottom: 8 },
  shortcutsRow: { gap: 8 },
  shortcutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
});
