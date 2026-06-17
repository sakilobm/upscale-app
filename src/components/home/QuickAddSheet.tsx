/**
 * @file QuickAddSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Full-screen bottom-sheet for quickly adding an expense or income.
 *   Delegates all form logic to useQuickAddTransaction; owns only the animation
 *   (slide-up on show, slide-down on hide) and the category-form sub-sheet.
 * @associatedFiles src/features/transactions/hooks/useQuickAddTransaction.ts,
 *   src/features/transactions/utils/numpad.ts, src/app/(tabs)/index.tsx
 */

import React, { useState, useEffect, type ComponentProps } from 'react';
import {
  View, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Platform, Dimensions, KeyboardAvoidingView,
} from 'react-native';
import { useKeyboardHeight } from '@hooks/useKeyboardHeight';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useQuickAddTransaction } from '@features/transactions/hooks/useQuickAddTransaction';
import { NUMPAD_KEYS } from '@features/transactions/utils/numpad';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius } from '@constants/index';

import { CURRENCY_SYMBOLS } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
const { height: SH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  initialType: 'expense' | 'income';
  onClose: () => void;
}

export function QuickAddSheet({ visible, initialType, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol, currency } = useFormatCurrency();
  const insets = useSafeAreaInsets();
  const [catFormVisible, setCatFormVisible] = useState(false);

  const {
    type, handleTypeChange,
    handleKey, category, setCategory,
    accountId, setAccountId,
    note, setNote,
    cats, accounts, amountDisplay,
    handleSave, reset,
  } = useQuickAddTransaction(onClose);

  const slideY = useSharedValue(SH * 0.9);
  const kbH = useKeyboardHeight();

  useEffect(() => {
    if (visible) {
      reset(initialType);
      slideY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH * 0.9, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, initialType]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  const sheetBg = colors.background.secondary;
  const inputBg = colors.background.primary;

  const selectedAccountCurrency = accounts.find((a) => a.id === accountId)?.currency ?? currency;
  const currentSymbol = CURRENCY_SYMBOLS[selectedAccountCurrency] ?? '$';
  const accentColor = type === 'expense' ? colors.status.expense : colors.status.income;

  return (
    <>
      <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
        <View style={[s.overlay, { backgroundColor: colors.overlay.medium }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <Animated.View style={[s.sheet, { backgroundColor: sheetBg, shadowColor: colors.black, paddingBottom: insets.bottom + 8, marginBottom: Platform.OS === 'android' ? kbH : 0 }, sheetStyle]}>

              <View style={[s.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

              {/* Type toggle */}
              <View style={[s.typeRow, { backgroundColor: colors.glass.backgroundMid }]}>
                {(['expense', 'income'] as const).map((t) => {
                  const active = type === t;
                  const tColor = t === 'expense' ? colors.status.expense : colors.status.income;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => { handleTypeChange(t); Haptics.selectionAsync(); }}
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
                <AppText style={[s.amountDisplay, { color: accentColor }]}>{currentSymbol}{amountDisplay}</AppText>
                <AppText variant="caption" style={{ color: colors.text.tertiary }}>
                  {selectedAccountCurrency}
                </AppText>
              </View>

              {/* Numpad */}
              <View style={s.numpad}>
                {NUMPAD_KEYS.map((key) => {
                  const isBackspace = key === '⌫';
                  const isDot = key === '.';
                  return (
                    <Pressable
                      key={key}
                      onPress={() => { handleKey(key); Haptics.selectionAsync(); }}
                      style={({ pressed }) => [
                        s.numKey,
                        {
                          backgroundColor: isBackspace ? accentColor + '15' : (isDark ? colors.glass.background : colors.background.primary),
                          opacity: pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      {isBackspace ? (
                        <Ionicons name="backspace-outline" size={22} color={accentColor} />
                      ) : (
                        <AppText style={[s.numKeyText, { color: isDot ? colors.text.secondary : colors.text.primary }]}>
                          {key}
                        </AppText>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Category */}
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
                        <Ionicons name={catDef.icon as IoniconName} size={15} color={catDef.color} />
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
                  style={[s.catChip, s.catNewChip, { borderColor: colors.brand.primary + '45' }]}
                >
                  <View style={[s.catIcon, { backgroundColor: colors.brand.primary + '18' }]}>
                    <Ionicons name="add" size={15} color={colors.brand.primary} />
                  </View>
                  <AppText variant="labelSM" style={{ color: colors.brand.primary, fontWeight: '600', fontSize: 11 }}>
                    New
                  </AppText>
                </Pressable>
              </ScrollView>

              {/* Account (only when >1) */}
              {accounts.length > 1 && (
                <>
                  <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary }]}>ACCOUNT</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.accountScroll}>
                    {accounts.map((acc) => {
                      const active = accountId === acc.id;
                      return (
                        <Pressable
                          key={acc.id}
                          onPress={() => setAccountId(acc.id)}
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
                            <Ionicons name={acc.icon as IoniconName} size={14} color={acc.color} />
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
                </>
              )}

              {/* Note */}
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

              {/* Add button */}
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [s.addBtn, { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                <AppText style={[s.addBtnText, { color: colors.white }]}>Add {type === 'expense' ? 'Expense' : 'Income'}</AppText>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <CategoryFormSheet
        visible={catFormVisible}
        onClose={() => setCatFormVisible(false)}
        onSaved={(id) => setCategory(id)}
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8, paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  typeRow: { flexDirection: 'row', borderRadius: Radius.xl, padding: 4, marginBottom: 16, gap: 4 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.lg },
  amountSection: { alignItems: 'center', paddingVertical: 8, marginBottom: 12 },
  amountDisplay: { fontSize: 42, fontWeight: '800', letterSpacing: -1, lineHeight: 52 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  numKey: { width: '30%', flexGrow: 1, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  numKeyText: { fontSize: 22, fontWeight: '600', lineHeight: 28 },
  sectionLabel: { letterSpacing: 1, fontSize: 10, fontWeight: '700', marginBottom: 8, marginLeft: 2 },
  catScroll: { gap: 8, paddingBottom: 12, paddingRight: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  catNewChip: { borderWidth: 1.5, borderStyle: 'dashed' },
  catIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  accountScroll: { gap: 8, paddingBottom: 12, paddingRight: 8 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full },
  accountIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteInput: { height: 44, borderRadius: Radius.lg, paddingHorizontal: 14, fontSize: 14, borderWidth: 1, marginBottom: 12, marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: Radius.lg, marginTop: 4 },
  addBtnText: { fontWeight: '700', fontSize: 16 },
});
