/**
 * @file AccountFormSheet.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Slide-up modal for creating or editing an account. Owns only local
 *   form state; the business-logic save callback is injected via onSave prop.
 *   Receives AccountFormState type from the headless hook to stay in sync.
 * @associatedFiles src/features/accounts/hooks/useAccountsScreen.ts, src/app/accounts.tsx
 */

import { useState, useEffect, type ComponentProps } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Modal,
  Platform, TextInput, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { Radius } from '@constants/Dimensions';
import { useTheme } from '@hooks/useTheme';
import {
  type AccountFormState,
  DEFAULT_ACCOUNT_FORM,
} from '@features/accounts/hooks/useAccountsScreen';
import type { Account, AccountType, CurrencyCode } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const { height: SH } = Dimensions.get('window');

const PRESET_COLORS: string[] = [
  '#6C63FF', '#10B981', '#38BDF8', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

const PRESET_ICONS: IoniconName[] = [
  'card-outline', 'wallet-outline', 'trending-up-outline',
  'cash-outline', 'business-outline', 'home-outline',
  'car-outline', 'heart-outline', 'star-outline', 'diamond-outline',
];

const CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking',   label: 'Checking'   },
  { value: 'savings',    label: 'Savings'    },
  { value: 'credit',     label: 'Credit'     },
  { value: 'investment', label: 'Investment' },
  { value: 'cash',       label: 'Cash'       },
];

import { useAuthStore } from '@store/authStore';

interface Props {
  visible:        boolean;
  editingAccount: Account | null;
  onClose:        () => void;
  onSave:         (form: AccountFormState) => void;
}

export function AccountFormSheet({ visible, editingAccount, onClose, onSave }: Props) {
  const { colors, isDark } = useTheme();
  const insets  = useSafeAreaInsets();
  const slideY  = useSharedValue(440);
  const [form, setForm] = useState<AccountFormState>(DEFAULT_ACCOUNT_FORM);

  const userCurrency = useAuthStore((s) => s.user?.currency) ?? 'USD';

  useEffect(() => {
    if (visible) {
      setForm(editingAccount ? {
        name:      editingAccount.name,
        type:      editingAccount.type,
        color:     editingAccount.color,
        icon:      editingAccount.icon as IoniconName,
        balance:   String(editingAccount.balance),
        currency:  editingAccount.currency as CurrencyCode,
        isDefault: editingAccount.isDefault,
      } : {
        ...DEFAULT_ACCOUNT_FORM,
        currency: userCurrency,
      });
      slideY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(440, { duration: 260, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  const set = <K extends keyof AccountFormState>(key: K, val: AccountFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const sheetBg = colors.background.secondary;
  const inputBg = colors.background.primary;
  const inputClr = colors.text.primary;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <Animated.View style={[s.sheet, sheetStyle, { backgroundColor: sheetBg, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.handle} />

          <View style={s.header}>
            <Pressable onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
            <AppText variant="headingSM" color={colors.text.primary}>
              {editingAccount ? 'Edit Account' : 'New Account'}
            </AppText>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {/* Live preview card */}
            <View style={[s.previewWrap, { shadowColor: form.color }]}>
              <LinearGradient colors={[form.color, form.color + 'BB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.previewCard}>
                <View style={[s.previewBlob1, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={[s.previewBlob2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
                <View style={s.previewContent}>
                  <View style={s.previewTop}>
                    <View style={[s.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name={form.icon} size={18} color="#FFF" />
                    </View>
                    <View style={s.typePill}>
                      <AppText style={s.typeText}>{form.type.toUpperCase()}</AppText>
                    </View>
                  </View>
                  <AppText style={[s.balanceValue, { fontSize: 22 }]}>
                    {form.currency || 'USD'} {parseFloat(form.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </AppText>
                  <AppText style={s.accountName}>{form.name || 'Account Name'}</AppText>
                </View>
              </LinearGradient>
            </View>

            {/* Name */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Account Name</AppText>
            <TextInput style={[s.input, { backgroundColor: inputBg, color: inputClr }]} value={form.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Main Checking" placeholderTextColor={colors.text.tertiary} />

            {/* Balance */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Balance</AppText>
            <TextInput style={[s.input, { backgroundColor: inputBg, color: inputClr }]} value={form.balance} onChangeText={(v) => set('balance', v.replace(/[^0-9.]/g, ''))} placeholder="0.00" placeholderTextColor={colors.text.tertiary} keyboardType="decimal-pad" />

            {/* Currency */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Currency</AppText>
            <View style={s.chipRow}>
              {CURRENCY_CODES.map((code) => {
                const active = form.currency === code;
                return (
                  <Pressable key={code} onPress={() => set('currency', code)}
                    style={[s.chip, { backgroundColor: active ? form.color : inputBg, borderColor: active ? form.color : 'transparent', borderWidth: 1.5 }]}
                  >
                    <AppText variant="labelSM" style={{ color: active ? '#FFF' : colors.text.secondary, fontWeight: active ? '700' : '500' }}>{code}</AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Type */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Account Type</AppText>
            <View style={s.chipRow}>
              {ACCOUNT_TYPES.map(({ value, label }) => {
                const active = form.type === value;
                return (
                  <Pressable key={value} onPress={() => set('type', value)}
                    style={[s.chip, { backgroundColor: active ? form.color : inputBg, borderColor: active ? form.color : 'transparent', borderWidth: 1.5 }]}
                  >
                    <AppText variant="labelSM" style={{ color: active ? '#FFF' : colors.text.secondary, fontWeight: active ? '700' : '500' }}>{label}</AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Color */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Color</AppText>
            <View style={s.colorRow}>
              {PRESET_COLORS.map((c) => {
                const active = form.color === c;
                return (
                  <Pressable key={c} onPress={() => set('color', c)}
                    style={[s.colorDot, { backgroundColor: c }, active && { transform: [{ scale: 1.2 }], borderWidth: 3, borderColor: '#FFF', shadowColor: c, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]}
                  />
                );
              })}
            </View>

            {/* Icon */}
            <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>Icon</AppText>
            <View style={s.iconRow}>
              {PRESET_ICONS.map((ic) => {
                const active = form.icon === ic;
                return (
                  <Pressable key={ic} onPress={() => set('icon', ic)}
                    style={[s.iconOption, { backgroundColor: active ? form.color + '22' : inputBg, borderWidth: active ? 2 : 0, borderColor: active ? form.color : 'transparent' }]}
                  >
                    <Ionicons name={ic} size={22} color={active ? form.color : colors.text.secondary} />
                  </Pressable>
                );
              })}
            </View>

            {/* Default toggle */}
            <Pressable onPress={() => set('isDefault', !form.isDefault)} style={s.toggleRow}>
              <View>
                <AppText variant="labelMD" color={colors.text.primary}>Set as Default</AppText>
                <AppText variant="caption" color={colors.text.tertiary}>Used as primary account across the app</AppText>
              </View>
              <View style={[s.toggle, { backgroundColor: form.isDefault ? form.color : colors.glass.backgroundStrong }]}>
                <View style={[s.toggleThumb, { transform: [{ translateX: form.isDefault ? 18 : 0 }] }]} />
              </View>
            </Pressable>

            {/* Save */}
            <Pressable onPress={() => onSave(form)} style={[s.saveBtn, { backgroundColor: form.color }]}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <AppText style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                {editingAccount ? 'Save Changes' : 'Create Account'}
              </AppText>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: SH * 0.92,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.3)', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  scroll:   { paddingHorizontal: 20, paddingBottom: 16, gap: 4 },

  previewWrap: {
    marginVertical: 12, borderRadius: Radius.xl,
    ...Platform.select({
      ios:     { shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 10 },
    }),
  },
  previewCard:    { height: 140, borderRadius: Radius.xl, overflow: 'hidden' },
  previewBlob1:   { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: -50, right: -40 },
  previewBlob2:   { position: 'absolute', width: 100, height: 100, borderRadius: 50, bottom: -30, left: 30 },
  previewContent: { flex: 1, padding: 16, justifyContent: 'space-between' },
  previewTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  typePill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' },
  typeText:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  balanceValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  accountName:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

  fieldLabel: { marginTop: 16, marginBottom: 6 },
  input: { height: 48, borderRadius: Radius.lg, paddingHorizontal: 14, fontSize: 15 },

  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 2 },
  chip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 4 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  iconRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 4 },
  toggle:    { width: 46, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: Radius.lg, marginTop: 20 },
});
