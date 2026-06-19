/**
 * @file AddPaymentSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Modal sheet for adding a new planned payment.
 * @associatedFiles src/features/budget/hooks/usePlannedPaymentForm.ts, src/app/(tabs)/budget.tsx
 */

import React, { useState } from 'react';
import {
  View, StyleSheet, Modal, TextInput,
  Platform, Pressable, ScrollView,
} from 'react-native';
import { KeyboardAvoidingSheet } from '@components/KeyboardAvoidingSheet';
import { DatePickerField } from '@components/DatePickerField';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { usePlannedPaymentForm } from '@features/budget/hooks/usePlannedPaymentForm';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Radius } from '@constants/index';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; amount: number; dueDate: string; category: string; accountId: string }) => void;
}

export function AddPaymentSheet({ visible, onClose, onSubmit }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const [createVisible, setCreateVisible] = useState(false);

  const {
    title, setTitle,
    amount, setAmount,
    dueDate, setDueDate,
    category, setCategory,
    accountId, setAccountId,
    accounts,
    cats,
    handleSubmit,
    error,
  } = usePlannedPaymentForm(onSubmit, onClose);

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));

  const handleShow = () => { scale.value = withSpring(1, { damping: 18, stiffness: 220 }); };
  const handleHide = () => { scale.value = withSpring(0.86, { damping: 18, stiffness: 220 }); };

  const cardBg = colors.surface.sheet;
  const inputBg = colors.surface.input;
  const dividerC = colors.glass.background;

  return (
    <>
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

            {/* ── Handle ─────────────────────────────── */}
            <View style={[s.handle, { backgroundColor: colors.text.tertiary + '35' }]} />

            {/* ── Header ─────────────────────────────── */}
            <View style={s.header}>
              <View>
                <AppText variant="headingMD" color={colors.text.primary}>Add Planned Payment</AppText>
                <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 2 }}>
                  Set a recurring or one-time payment
                </AppText>
              </View>
              <Pressable
                onPress={onClose} hitSlop={12}
                style={[s.closeBtn, { backgroundColor: colors.glass.backgroundMid }]}
              >
                <Ionicons name="close" size={17} color={colors.text.secondary} />
              </Pressable>
            </View>

            {/* ── Body + Footer via KeyboardAvoidingSheet ── */}
            <KeyboardAvoidingSheet
              dividerColor={dividerC}
              contentStyle={s.body}
              footer={
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand.onPrimary} />
                  <AppText variant="labelLG" style={{ color: colors.brand.onPrimary, fontWeight: '700' }}>
                    Add Payment
                  </AppText>
                </Pressable>
              }
            >
              {error && (
                <View style={[s.errorBanner, { backgroundColor: colors.status.expense + '12', borderColor: colors.status.expense + '30' }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.status.expense} />
                  <AppText style={[s.errorText, { color: colors.status.expense }]}>{error}</AppText>
                </View>
              )}

              {/* Title */}
              <View style={s.fieldGroup}>
                <AppText style={[s.fieldLabel, { color: colors.text.tertiary }]}>TITLE</AppText>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="e.g. Rent, Netflix, Insurance"
                  placeholderTextColor={colors.text.tertiary}
                  value={title} onChangeText={setTitle}
                />
              </View>

              {/* Amount */}
              <View style={s.fieldGroup}>
                <AppText style={[s.fieldLabel, { color: colors.text.tertiary }]}>AMOUNT ({symbol})</AppText>
                <TextInput
                  style={[s.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="0.00" placeholderTextColor={colors.text.tertiary}
                  value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
                />
              </View>

              {/* Due Date */}
              <View style={s.fieldGroup}>
                <DatePickerField
                  label="DUE DATE"
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Pick a due date"
                />
              </View>

              {/* Category */}
              <View style={s.fieldGroup}>
                <View style={s.catHeader}>
                  <AppText style={[s.fieldLabel, { color: colors.text.tertiary }]}>CATEGORY</AppText>
                  <Pressable
                    onPress={() => setCreateVisible(true)}
                    style={[s.newCatBtn, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '40' }]}
                  >
                    <Ionicons name="add" size={13} color={colors.brand.primary} />
                    <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 11 }}>New</AppText>
                  </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
                  {cats.map((cat) => {
                    const active = cat.id === category;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategory(cat.id)}
                        style={[
                          s.catChip,
                          {
                            backgroundColor: active ? cat.color + '18' : inputBg,
                            borderColor: active ? cat.color + '55' : 'transparent',
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <View style={[s.catIconBox, { backgroundColor: cat.color + '22' }]}>
                          <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                        </View>
                        <AppText
                          variant="caption"
                          style={{ color: active ? cat.color : colors.text.secondary, fontWeight: active ? '700' : '500' }}
                        >
                          {cat.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Pay From Account */}
              <View style={s.fieldGroup}>
                <AppText style={[s.fieldLabel, { color: colors.text.tertiary }]}>PAY FROM ACCOUNT</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
                  {accounts.map((acc) => {
                    const active = acc.id === accountId;
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => setAccountId(acc.id)}
                        style={[
                          s.catChip,
                          {
                            backgroundColor: active ? acc.color + '18' : inputBg,
                            borderColor: active ? acc.color + '55' : 'transparent',
                            borderWidth: 1.5,
                          },
                        ]}
                      >
                        <View style={[s.catIconBox, { backgroundColor: acc.color + '22' }]}>
                          <Ionicons name={acc.icon as any} size={13} color={acc.color} />
                        </View>
                        <AppText
                          variant="caption"
                          style={{ color: active ? acc.color : colors.text.secondary, fontWeight: active ? '700' : '500' }}
                        >
                          {acc.name}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </KeyboardAvoidingSheet>

          </Animated.View>
        </View>
      </Modal>

      <CategoryFormSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSaved={(id) => setCategory(id)}
      />
    </>
  );
}

const s = StyleSheet.create({
  outer: { flex: 1, justifyContent: 'flex-end' },

  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    // Horizontal padding lives here — covers handle + header.
    // KeyboardAvoidingSheet body uses paddingHorizontal: 0 (via s.body) to avoid double-indenting.
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.14, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },

  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 16 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },

  // Body inside KeyboardAvoidingSheet — NO extra horizontal padding (sheet already provides it).
  body: {
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 16,
  },

  fieldGroup: { gap: 7 },
  fieldLabel: { fontSize: 10, letterSpacing: 0.9, fontWeight: '700' },

  input: {
    height: 48, borderRadius: Radius.lg,
    paddingHorizontal: Spacing['4'], fontSize: 15,
  },

  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  newCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },

  catRow: { gap: 8, paddingBottom: 4, paddingRight: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: Radius.full },
  catIconBox: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 54, borderRadius: Radius.xl,
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
