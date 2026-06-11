import { useState, useRef, useEffect, type ComponentProps } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolateColor,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { ConfirmModal } from '@components/ConfirmModal';
import { useTheme } from '@hooks/useTheme';
import { useAccountStore } from '@store/accountStore';
import { toast } from '@store/toastStore';
import { Radius } from '@constants/Dimensions';
import type { Account, AccountType, CurrencyCode } from '@store/types';

const CURRENCY_CODES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');
const CARD_H = 210;
const CARD_W = SW - 48;
const CARD_GAP = 16;
const PAGE_W = CARD_W + CARD_GAP;

const PRESET_COLORS = [
  '#6C63FF', '#10B981', '#38BDF8', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

const PRESET_ICONS: IoniconName[] = [
  'card-outline', 'wallet-outline', 'trending-up-outline',
  'cash-outline', 'business-outline', 'home-outline',
  'car-outline', 'heart-outline', 'star-outline', 'diamond-outline',
];

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit', label: 'Credit' },
  { value: 'investment', label: 'Investment' },
  { value: 'cash', label: 'Cash' },
];

// ─── Account Card ─────────────────────────────────────────────────────────────

function AccountCard({ account, isActive }: { account: Account; isActive: boolean }) {
  const scaleAnim = useSharedValue(isActive ? 1 : 0.93);
  useEffect(() => {
    scaleAnim.value = withSpring(isActive ? 1 : 0.93, { damping: 18, stiffness: 200 });
  }, [isActive]);

  const cardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    shadowOpacity: isActive ? 0.45 : 0.15,
  }));

  const darker = account.color + 'CC';
  const lighterHex = account.color;

  return (
    <View style={styles.cardPage}>
      {/* Shadow wrapper — separate from clip to preserve iOS shadow */}
      <Animated.View
        style={[
          styles.cardShadow,
          { shadowColor: account.color },
          cardAnimStyle,
        ]}
      >
        {/* Clip wrapper */}
        <View style={styles.cardClip}>
          <LinearGradient
            colors={[lighterHex, darker]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />
          <View style={styles.blob3} />

          {/* Card chip (credit card style) */}
          <View style={styles.chip}>
            <View style={styles.chipInner} />
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={styles.iconCircle}>
                <Ionicons name={account.icon as IoniconName} size={22} color="#FFF" />
              </View>
              <View style={styles.typePill}>
                <AppText style={styles.typeText}>{account.type.toUpperCase()}</AppText>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.cardMid}>
              <AppText style={styles.balanceLabel}>BALANCE</AppText>
              <AppText style={styles.balanceValue}>
                {account.currency} {account.balance.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </AppText>
              <AppText style={styles.accountName}>{account.name}</AppText>
            </View>

            {/* Bottom row */}
            <View style={styles.cardBottom}>
              {account.isDefault && (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.9)" />
                  <AppText style={styles.defaultText}>DEFAULT</AppText>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <AppText style={styles.cardCurrencyCode}>{account.currency}</AppText>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Dots ─────────────────────────────────────────────────────────────────────

function Dots({
  count,
  activeIdx,
  color,
}: {
  count: number;
  activeIdx: number;
  color: string;
}) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIdx
              ? { width: 20, backgroundColor: color }
              : { width: 6, backgroundColor: color + '40' },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: IoniconName;
  color: string;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF' },
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <AppText variant="labelSM" style={{ color: colors.text.tertiary, marginTop: 8 }}>
        {label}
      </AppText>
      <AppText variant="labelLG" style={{ color: colors.text.primary, fontWeight: '700', marginTop: 2 }}>
        {value}
      </AppText>
    </View>
  );
}

// ─── Form sheet ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  type: AccountType;
  color: string;
  icon: IoniconName;
  balance: string;
  currency: CurrencyCode;
  isDefault: boolean;
}

const DEFAULT_FORM: FormState = {
  name: '',
  type: 'checking',
  color: PRESET_COLORS[0],
  icon: PRESET_ICONS[0],
  balance: '',
  currency: 'USD' as CurrencyCode,
  isDefault: false,
};

function FormSheet({
  visible,
  editingAccount,
  onClose,
  onSave,
}: {
  visible: boolean;
  editingAccount: Account | null;
  onClose: () => void;
  onSave: (form: FormState) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const slideY = useSharedValue(440);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (visible) {
      setForm(
        editingAccount
          ? {
              name: editingAccount.name,
              type: editingAccount.type,
              color: editingAccount.color,
              icon: editingAccount.icon as IoniconName,
              balance: String(editingAccount.balance),
              currency: editingAccount.currency as CurrencyCode,
              isDefault: editingAccount.isDefault,
            }
          : DEFAULT_FORM,
      );
      slideY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(440, { duration: 260, easing: Easing.in(Easing.cubic) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const sheetBg = isDark ? colors.background.secondary : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F5F5F8';
  const inputClr = colors.text.primary;

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.overlayBg} onPress={onClose} />

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { backgroundColor: sheetBg, paddingBottom: insets.bottom + 16 },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Pressable onPress={onClose} style={styles.sheetBack}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
            <AppText variant="headingSM" color={colors.text.primary}>
              {editingAccount ? 'Edit Account' : 'New Account'}
            </AppText>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetScroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live preview card */}
            <View style={[styles.previewWrap, { shadowColor: form.color }]}>
              <LinearGradient
                colors={[form.color, form.color + 'BB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewCard}
              >
                <View style={[styles.previewBlob1, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
                <View style={[styles.previewBlob2, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
                <View style={styles.cardContent}>
                  <View style={styles.cardTop}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Ionicons name={form.icon} size={18} color="#FFF" />
                    </View>
                    <View style={styles.typePill}>
                      <AppText style={styles.typeText}>{form.type.toUpperCase()}</AppText>
                    </View>
                  </View>
                  <AppText style={[styles.balanceValue, { fontSize: 22 }]}>
                    {form.currency || 'USD'} {parseFloat(form.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </AppText>
                  <AppText style={styles.accountName}>
                    {form.name || 'Account Name'}
                  </AppText>
                </View>
              </LinearGradient>
            </View>

            {/* Name */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Account Name
            </AppText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: inputClr }]}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="e.g. Main Checking"
              placeholderTextColor={colors.text.tertiary}
            />

            {/* Balance */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Balance
            </AppText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: inputClr }]}
              value={form.balance}
              onChangeText={(v) => setField('balance', v.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
            />

            {/* Currency chips */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Currency
            </AppText>
            <View style={styles.currencyRow}>
              {CURRENCY_CODES.map((code) => {
                const active = form.currency === code;
                return (
                  <Pressable
                    key={code}
                    onPress={() => setField('currency', code)}
                    style={[
                      styles.currencyChip,
                      {
                        backgroundColor: active ? form.color : inputBg,
                        borderColor: active ? form.color : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <AppText
                      variant="labelSM"
                      style={{
                        color: active ? '#FFF' : colors.text.secondary,
                        fontWeight: active ? '700' : '500',
                      }}
                    >
                      {code}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Type */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Account Type
            </AppText>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map(({ value, label }) => {
                const active = form.type === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setField('type', value)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: active ? form.color : inputBg,
                        borderColor: active ? form.color : 'transparent',
                      },
                    ]}
                  >
                    <AppText
                      variant="labelSM"
                      style={{ color: active ? '#FFF' : colors.text.secondary, fontWeight: active ? '700' : '500' }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Color */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Color
            </AppText>
            <View style={styles.colorRow}>
              {PRESET_COLORS.map((c) => {
                const active = form.color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setField('color', c)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      active && {
                        transform: [{ scale: 1.2 }],
                        borderWidth: 3,
                        borderColor: '#FFF',
                        shadowColor: c,
                        shadowOpacity: 0.7,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 0 },
                        elevation: 6,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {/* Icon */}
            <AppText variant="labelMD" color={colors.text.secondary} style={styles.fieldLabel}>
              Icon
            </AppText>
            <View style={styles.iconRow}>
              {PRESET_ICONS.map((ic) => {
                const active = form.icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setField('icon', ic)}
                    style={[
                      styles.iconOption,
                      {
                        backgroundColor: active ? form.color + '22' : inputBg,
                        borderWidth: active ? 2 : 0,
                        borderColor: active ? form.color : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons name={ic} size={22} color={active ? form.color : colors.text.secondary} />
                  </Pressable>
                );
              })}
            </View>

            {/* Default toggle */}
            <Pressable
              onPress={() => setField('isDefault', !form.isDefault)}
              style={styles.toggleRow}
            >
              <View>
                <AppText variant="labelMD" color={colors.text.primary}>
                  Set as Default
                </AppText>
                <AppText variant="caption" color={colors.text.tertiary}>
                  Used as primary account across the app
                </AppText>
              </View>
              <View
                style={[
                  styles.toggle,
                  { backgroundColor: form.isDefault ? form.color : (isDark ? '#333' : '#DDD') },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: form.isDefault ? 18 : 0 }] },
                  ]}
                />
              </View>
            </Pressable>

            {/* Save button */}
            <Pressable
              onPress={() => onSave(form)}
              style={[styles.saveBtn, { backgroundColor: form.color }]}
            >
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const accounts = useAccountStore((s) => s.accounts);
  const addAccount = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const scrollX = useSharedValue(0);

  const bgStyle = useAnimatedStyle(() => {
    if (accounts.length === 0) return { backgroundColor: isDark ? '#0F1524' : '#F0F0F8' };
    if (accounts.length === 1)
      return { backgroundColor: isDark ? accounts[0].color + '22' : accounts[0].color + '14' };
    const inputRange = accounts.map((_, i) => i * PAGE_W);
    const outputColors = isDark
      ? accounts.map((a) => a.color + '22')
      : accounts.map((a) => a.color + '14');
    const bg = interpolateColor(scrollX.value, inputRange, outputColors);
    return { backgroundColor: bg };
  });

  const selectedAccount = accounts[selectedIdx] ?? accounts[0] ?? null;

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollX.value = x;
    const idx = Math.round(x / PAGE_W);
    if (idx !== selectedIdx && idx >= 0 && idx < accounts.length) {
      setSelectedIdx(idx);
    }
  };

  const scrollToIdx = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * PAGE_W, animated: true });
    setSelectedIdx(idx);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteConfirm = (account: Account) => {
    if (accounts.length <= 1) {
      toast.error('Cannot delete the last account');
      return;
    }
    setDeleteTarget(account);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteExecute = () => {
    if (!deleteTarget) return;
    deleteAccount(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedIdx >= accounts.length - 1) setSelectedIdx(Math.max(0, accounts.length - 2));
    setDeleteTarget(null);
  };

  const handleSetDefault = (account: Account) => {
    accounts.forEach((a) => {
      updateAccount(a.id, { isDefault: a.id === account.id });
    });
    toast.success(`"${account.name}" set as default`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = (form: FormState) => {
    if (!form.name.trim()) {
      toast.error('Account name is required');
      return;
    }
    const balance = parseFloat(form.balance) || 0;

    if (editingAccount) {
      // Update
      if (form.isDefault) {
        accounts.forEach((a) => {
          if (a.id !== editingAccount.id) updateAccount(a.id, { isDefault: false });
        });
      }
      updateAccount(editingAccount.id, {
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        icon: form.icon,
        balance,
        currency: form.currency,
        isDefault: form.isDefault,
      });
      toast.success('Account updated');
    } else {
      // Create
      if (form.isDefault) {
        accounts.forEach((a) => updateAccount(a.id, { isDefault: false }));
      }
      const newAccount: Account = {
        id: `acc-${Date.now()}`,
        userId: 'user-1',
        name: form.name.trim(),
        type: form.type,
        balance,
        currency: form.currency,
        color: form.color,
        icon: form.icon,
        isDefault: form.isDefault || accounts.length === 0,
        createdAt: new Date().toISOString(),
      };
      addAccount(newAccount);
      toast.success(`"${newAccount.name}" created`);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFormVisible(false);
  };

  const accColor = selectedAccount?.color ?? colors.brand.primary;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0B0F1C' : '#F6F6FA' }]}>
      {/* Dynamic background tint */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ─── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.headerBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? '#FFF' : colors.text.primary}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <AppText
              variant="headingMD"
              style={{ color: isDark ? '#FFF' : colors.text.primary, fontWeight: '800' }}
            >
              My Accounts
            </AppText>
            <AppText variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : colors.text.tertiary }}>
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </AppText>
          </View>

          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: accColor, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        </View>

        {/* ─── Net Worth ───────────────────────────────────────── */}
        <Animated.View
          entering={FadeIn.delay(100).duration(400)}
          style={styles.heroSection}
        >
          <AppText
            variant="caption"
            style={{ color: isDark ? 'rgba(255,255,255,0.5)' : colors.text.tertiary, letterSpacing: 1.5 }}
          >
            TOTAL NET WORTH
          </AppText>
          <AppText
            style={[styles.heroBalance, { color: isDark ? '#FFFFFF' : colors.text.primary }]}
          >
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </AppText>
        </Animated.View>

        {/* ─── Card Carousel ───────────────────────────────────── */}
        {accounts.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyCards}>
            <View style={[styles.emptyCardPlaceholder, { borderColor: colors.text.tertiary + '30' }]}>
              <Ionicons name="wallet-outline" size={40} color={colors.text.tertiary} />
              <AppText variant="bodyMD" color={colors.text.tertiary} style={{ marginTop: 12 }}>
                No accounts yet
              </AppText>
              <Pressable
                onPress={handleAdd}
                style={[styles.emptyAddBtn, { backgroundColor: colors.brand.primary }]}
              >
                <AppText style={{ color: '#FFF', fontWeight: '700' }}>Add First Account</AppText>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <>
            <View style={styles.carouselWrapper}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled={false}
                snapToInterval={PAGE_W}
                decelerationRate="fast"
                disableIntervalMomentum
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.carouselContent,
                  { paddingRight: SW - CARD_W - 24 },
                ]}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.carousel}
              >
                {accounts.map((acc, i) => (
                  <AccountCard key={acc.id} account={acc} isActive={i === selectedIdx} />
                ))}
              </ScrollView>
            </View>

            <Dots count={accounts.length} activeIdx={selectedIdx} color={accColor} />
          </>
        )}

        {/* ─── Selected Account Details ────────────────────────── */}
        {selectedAccount && (
          <ScrollView
            key={selectedAccount.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsSection}
          >
            {/* Stats row */}
            <View style={styles.statsRow}>
              <StatCard
                label="Balance"
                value={`$${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                icon="cash-outline"
                color={accColor}
              />
              <StatCard
                label="Type"
                value={selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}
                icon="layers-outline"
                color={accColor}
              />
              <StatCard
                label="Currency"
                value={selectedAccount.currency}
                icon="globe-outline"
                color={accColor}
              />
            </View>

            {/* Action buttons */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => handleEdit(selectedAccount)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: accColor + '18', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="pencil" size={16} color={accColor} />
                <AppText variant="labelMD" style={{ color: accColor, fontWeight: '600' }}>
                  Edit
                </AppText>
              </Pressable>

              {!selectedAccount.isDefault && (
                <Pressable
                  onPress={() => handleSetDefault(selectedAccount)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: isDark ? '#FFFFFF0D' : '#0000000A', opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons name="star-outline" size={16} color={colors.text.secondary} />
                  <AppText variant="labelMD" style={{ color: colors.text.secondary, fontWeight: '600' }}>
                    Set Default
                  </AppText>
                </Pressable>
              )}

              {selectedAccount.isDefault && (
                <View style={[styles.actionBtn, { backgroundColor: accColor + '0F' }]}>
                  <Ionicons name="star" size={16} color={accColor} />
                  <AppText variant="labelMD" style={{ color: accColor, fontWeight: '600' }}>
                    Default
                  </AppText>
                </View>
              )}

              <Pressable
                onPress={() => handleDeleteConfirm(selectedAccount)}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.status.expense + '15', opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.status.expense} />
                <AppText variant="labelMD" style={{ color: colors.status.expense, fontWeight: '600' }}>
                  Delete
                </AppText>
              </Pressable>
            </View>

            {/* All accounts quick list */}
            <AppText
              variant="labelMD"
              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : colors.text.tertiary, marginTop: 24, marginBottom: 12 }}
            >
              ALL ACCOUNTS
            </AppText>
            <View style={styles.allAccountsList}>
              {accounts.map((acc, idx) => {
                const isSelected = idx === selectedIdx;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => scrollToIdx(idx)}
                    style={({ pressed }) => [
                      styles.accountRow,
                      {
                        backgroundColor: isSelected
                          ? acc.color + '18'
                          : isDark ? '#FFFFFF08' : '#00000006',
                        borderColor: isSelected ? acc.color + '40' : 'transparent',
                        borderWidth: 1,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.accountRowIcon, { backgroundColor: acc.color + '22' }]}>
                      <Ionicons name={acc.icon as IoniconName} size={18} color={acc.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText
                        variant="labelMD"
                        style={{ color: isDark ? '#FFF' : colors.text.primary, fontWeight: '600' }}
                      >
                        {acc.name}
                      </AppText>
                      <AppText variant="caption" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : colors.text.tertiary }}>
                        {acc.type}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText
                        variant="labelMD"
                        style={{ color: acc.color, fontWeight: '700' }}
                      >
                        ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </AppText>
                      {acc.isDefault && (
                        <AppText variant="caption" style={{ color: acc.color + 'AA', fontSize: 10 }}>
                          default
                        </AppText>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ─── Form Sheet ────────────────────────────────────────── */}
      <FormSheet
        visible={formVisible}
        editingAccount={editingAccount}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
      />

      {/* ─── Delete Confirm ─────────────────────────────────────── */}
      <ConfirmModal
        visible={!!deleteTarget}
        title="Delete Account"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteExecute}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },

  // Hero balance
  heroSection: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 20,
    gap: 6,
  },
  heroBalance: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 50,   // explicit line height prevents custom-font clipping
    includeFontPadding: false,
  },

  // Carousel — use wrapper with paddingVertical so iOS shadows don't get clipped
  carouselWrapper: {
    paddingVertical: 14,
  },
  carousel: {
    flexGrow: 0,
  },
  carouselContent: {
    paddingLeft: 24,
    gap: CARD_GAP,
  },
  cardPage: {
    width: CARD_W,
  },
  cardShadow: {
    borderRadius: Radius.xl,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 12 }, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  cardClip: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.14)',
    top: -60,
    right: -50,
  },
  blob2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: -40,
    left: 40,
  },
  blob3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 20,
    left: -20,
  },
  chip: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInner: {
    width: 22,
    height: 16,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  cardMid: {
    gap: 4,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  defaultText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
  },
  cardCurrencyCode: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  // Empty state
  emptyCards: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  emptyCardPlaceholder: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyAddBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },

  // Stats
  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },

  // All accounts list
  allAccountsList: {
    gap: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
  },
  accountRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form sheet
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SH * 0.92,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },

  // Preview card
  previewWrap: {
    marginVertical: 12,
    borderRadius: Radius.xl,
    ...Platform.select({
      ios: { shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
      android: { elevation: 10 },
    }),
  },
  previewCard: {
    height: 140,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  previewBlob1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -50,
    right: -40,
  },
  previewBlob2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -30,
    left: 30,
  },

  // Form inputs
  fieldLabel: {
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 4,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 4,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: Radius.lg,
    marginTop: 20,
  },
});
