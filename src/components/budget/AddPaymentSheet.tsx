/**
 * @file AddPaymentSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Modal sheet for adding a new planned payment. Consumes usePlannedPaymentForm
 *   for all form state and validation; the parent (budget.tsx) only passes visible/close/submit.
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
  onSubmit: (data: { title: string; amount: number; dueDate: string; category: string }) => void;
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
    cats,
    handleSubmit,
  } = usePlannedPaymentForm(onSubmit, onClose);

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));

  const handleShow = () => { scale.value = withSpring(1, { damping: 18, stiffness: 220 }); };
  const handleHide = () => { scale.value = withSpring(0.86, { damping: 18, stiffness: 220 }); };

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F5F5F7';

  return (
    <>
      <Modal
        visible={visible} transparent animationType="none"
        onRequestClose={onClose} onShow={handleShow} onDismiss={handleHide}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={isDark ? 40 : 30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </Pressable>

        <View style={s.outer} pointerEvents="box-none">
          <Animated.View style={[s.sheet, sheetStyle, { backgroundColor: cardBg }]}>
            <View style={[s.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

            <View style={s.header}>
              <AppText variant="headingSM" color={colors.text.primary}>Add Planned Payment</AppText>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text.tertiary} />
              </Pressable>
            </View>

            <KeyboardAvoidingSheet
              footer={
                <Pressable
                  onPress={handleSubmit}
                  style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color={isDark ? '#000' : '#FFFFFF'} />
                  <AppText variant="labelLG" style={{ color: isDark ? '#000' : '#FFFFFF', fontWeight: '700' }}>
                    Add Payment
                  </AppText>
                </Pressable>
              }
            >
              <AppText variant="labelSM" color={colors.text.tertiary} style={s.fieldLabel}>TITLE</AppText>
              <TextInput
                style={[s.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                placeholder="e.g. Rent, Netflix, Insurance"
                placeholderTextColor={colors.text.tertiary}
                value={title} onChangeText={setTitle}
              />

              <AppText variant="labelSM" color={colors.text.tertiary} style={s.fieldLabel}>AMOUNT ({symbol})</AppText>
              <TextInput
                style={[s.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                placeholder="0.00" placeholderTextColor={colors.text.tertiary}
                value={amount} onChangeText={setAmount} keyboardType="decimal-pad"
              />

              <DatePickerField
                label="DUE DATE"
                value={dueDate}
                onChange={setDueDate}
                placeholder="Pick a due date"
              />

              <View style={s.catHeader}>
                <AppText variant="labelSM" color={colors.text.tertiary} style={s.fieldLabel}>CATEGORY</AppText>
                <Pressable
                  onPress={() => setCreateVisible(true)}
                  style={[s.createCatBtn, { backgroundColor: colors.brand.primary + '15', borderColor: colors.brand.primary + '45' }]}
                >
                  <Ionicons name="add" size={13} color={colors.brand.primary} />
                  <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '600' }}>New</AppText>
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
                          backgroundColor: active ? cat.color + '1A' : inputBg,
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
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing['5'], paddingTop: Spacing['3'], gap: Spacing['3'],
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: Spacing['2'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: Spacing['1'] },
  input: { height: 46, borderRadius: Radius.lg, paddingHorizontal: Spacing['4'], fontSize: 15 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  createCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  catRow: { gap: Spacing['2'], paddingBottom: Spacing['2'], paddingRight: Spacing['2'] },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  catIconBox: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], height: 52, borderRadius: Radius.lg,
  },
});
