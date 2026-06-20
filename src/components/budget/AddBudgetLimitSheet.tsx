import React, { useState } from 'react';
import {
  View, StyleSheet, Modal, TextInput,
  Platform, Pressable, ScrollView,
} from 'react-native';
import { KeyboardAvoidingSheet } from '@components/KeyboardAvoidingSheet';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useBudgetStore } from '@store/budgetStore';
import { Spacing, Radius } from '@constants/index';
import { toast } from '@store/toastStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#3B82F6' },
  { id: 'food', label: 'Food', icon: 'restaurant-outline', color: '#10B981' },
  { id: 'transport', label: 'Transport', icon: 'car-outline', color: '#38BDF8' },
  { id: 'health', label: 'Health', icon: 'fitness-outline', color: '#EF4444' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#8B5CF6' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#EC4899' },
  { id: 'education', label: 'Education', icon: 'school-outline', color: '#F59E0B' },
  { id: 'savings', label: 'Savings', icon: 'wallet-outline', color: '#10B981' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export function AddBudgetLimitSheet({ visible, onClose, defaultCategory }: Props) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const addBudget = useBudgetStore((s) => s.addBudget);
  const existingBudgets = useBudgetStore((s) => s.budgets);

  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setCategory(defaultCategory || 'food');
      setLimit('');
      setError(null);
    }
  }, [visible, defaultCategory]);

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: scale.value }));

  const handleShow = () => { scale.value = withSpring(1, { damping: 18, stiffness: 220 }); };
  const handleHide = () => { scale.value = withSpring(0.86, { damping: 18, stiffness: 220 }); };

  const handleSubmit = () => {
    const val = parseFloat(limit);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid limit amount');
      return;
    }

    if (existingBudgets.some((b) => b.category === category)) {
      setError(`A budget limit for "${category}" already exists.`);
      return;
    }

    const catInfo = CATEGORIES.find((c) => c.id === category);
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    addBudget({
      id: `b-${Date.now()}`,
      userId: 'user-1',
      category,
      limit: val,
      spent: 0,
      currency: 'USD',
      period: 'monthly',
      startDate: firstDay,
      endDate: lastDay,
      color: catInfo?.color ?? '#8B5CF6',
    });

    toast.success(`Monthly limit of ${symbol}${val} set for ${category}`);
    setLimit('');
    setError(null);
    onClose();
  };

  const cardBg = colors.surface.sheet;
  const inputBg = colors.surface.input;
  const dividerC = colors.glass.background;

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
              <AppText variant="headingMD" color={colors.text.primary}>Set Category Budget</AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 2 }}>
                Establish a monthly spending limit
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
                style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.brand.onPrimary} />
                <AppText style={[s.submitBtnText, { color: colors.brand.onPrimary }]}>Set Budget Limit</AppText>
              </Pressable>
            }
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.form}>
              
              {/* Error box */}
              {!!error && (
                <View style={[s.errorBox, { backgroundColor: colors.status.expense + '15', borderColor: colors.status.expense + '30' }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.status.expense} />
                  <AppText variant="caption" style={{ color: colors.status.expense, fontWeight: '600', flex: 1 }}>{error}</AppText>
                </View>
              )}

              {/* Input Limit */}
              <View style={s.inputGroup}>
                <AppText variant="labelSM" color={colors.text.secondary}>Monthly Spending Limit</AppText>
                <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: colors.glass.border }]}>
                  <AppText style={[s.symbolText, { color: colors.text.tertiary }]}>{symbol}</AppText>
                  <TextInput
                    style={[s.input, { color: colors.text.primary }]}
                    keyboardType="decimal-pad"
                    value={limit}
                    onChangeText={(val) => { setLimit(val); setError(null); }}
                    placeholder="0.00"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>
              </View>

              {/* Select Category */}
              <View style={s.inputGroup}>
                <AppText variant="labelSM" color={colors.text.secondary}>Category</AppText>
                <View style={s.catList}>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => { setCategory(cat.id); setError(null); }}
                        style={[
                          s.catItem,
                          {
                            borderColor: active ? cat.color : colors.glass.border,
                            backgroundColor: active ? cat.color + '15' : 'transparent',
                          },
                        ]}
                      >
                        <Ionicons name={cat.icon as any} size={15} color={active ? cat.color : colors.text.secondary} />
                        <AppText
                          variant="caption"
                          style={{
                            color: active ? cat.color : colors.text.secondary,
                            fontWeight: '700',
                          }}
                        >
                          {cat.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

            </ScrollView>
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
  submitBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { fontSize: 16, fontWeight: '700' },
  catList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
});
