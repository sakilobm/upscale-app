import React, { useEffect, type ComponentProps } from 'react';
import {
  View, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Platform, Dimensions, KeyboardAvoidingView,
} from 'react-native';
import { useKeyboardHeight } from '@hooks/useKeyboardHeight';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
  withRepeat, withSequence, FadeIn, FadeOut, ZoomIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTransferFunds } from '@features/transactions/hooks/useTransferFunds';
import { NUMPAD_KEYS } from '@features/transactions/utils/numpad';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing } from '@constants/index';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { CURRENCY_SYMBOLS } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
const { height: SH } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function TransferSheet({ visible, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const kbH = useKeyboardHeight();

  const {
    fromAccountId, setFromAccountId,
    toAccountId, setToAccountId,
    amountStr, handleKey,
    note, setNote,
    accounts, amountDisplay,
    swapAccounts, handleSave, reset,
    status,
  } = useTransferFunds(onClose);

  const slideY = useSharedValue(SH * 0.9);
  const swapRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      reset();
      slideY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH * 0.9, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  useEffect(() => {
    if (status === 'processing') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 750, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 750, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = 1;
    }
  }, [status]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  const swapIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swapRotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(status === 'processing' ? 1 : 0, { duration: 250 }),
  }));

  const handleSwapPress = () => {
    swapAccounts();
    swapRotation.value = withTiming(swapRotation.value + 180, { duration: 300, easing: Easing.out(Easing.back()) });
  };

  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      router.push('/accounts?add=true');
    }, 320);
  };

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const activeCurrency = fromAccount?.currency ?? 'USD';
  const activeSymbol = CURRENCY_SYMBOLS[activeCurrency] ?? '$';

  const sheetBg = colors.background.secondary;
  const inputBg = colors.background.primary;
  const brandColor = colors.brand.primary;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[s.overlay, { backgroundColor: colors.overlay.medium }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <Animated.View style={[s.sheet, { backgroundColor: sheetBg, shadowColor: colors.black, paddingBottom: insets.bottom + 8, marginBottom: Platform.OS === 'android' ? kbH : 0 }, sheetStyle]}>
            <View style={[s.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

            {/* Premium Asynchronous Feedback Overlay */}
            {status !== 'idle' && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(250)}
                style={[s.feedbackOverlay, { backgroundColor: sheetBg }]}
              >
                {status === 'processing' ? (
                  <Animated.View entering={ZoomIn.duration(400)} style={s.feedbackContent}>
                    <View style={s.spinnerContainer}>
                      <Animated.View style={[s.pulseCircle, { borderColor: brandColor + '40' }, pulseStyle]} />
                      <Ionicons name="swap-horizontal" size={32} color={brandColor} />
                    </View>
                    <AppText variant="headingSM" style={{ color: colors.text.primary, fontWeight: '800', marginTop: 20 }}>
                      Processing Transfer
                    </AppText>
                    <AppText variant="caption" style={{ color: colors.text.tertiary, marginTop: 6, fontSize: 13 }}>
                      Moving your funds securely...
                    </AppText>
                  </Animated.View>
                ) : (
                  <Animated.View entering={ZoomIn.duration(400).springify()} style={s.feedbackContent}>
                    <View style={[s.successCircle, { backgroundColor: colors.status.income + '18', borderColor: colors.status.income + '40' }]}>
                      <Ionicons name="checkmark" size={36} color={colors.status.income} />
                    </View>

                    <AppText variant="headingSM" style={{ color: colors.text.primary, fontWeight: '800', marginTop: 20 }}>
                      Transfer Successful!
                    </AppText>

                    <View style={[s.receiptCard, { backgroundColor: isDark ? colors.glass.background : colors.background.primary, borderColor: colors.glass.border }]}>
                      <View style={s.receiptRow}>
                        <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>Amount</AppText>
                        <AppText variant="labelMD" style={{ color: colors.text.primary, fontWeight: '800' }}>
                          {activeSymbol}{amountDisplay}
                        </AppText>
                      </View>

                      <View style={[s.receiptDivider, { backgroundColor: colors.glass.border }]} />

                      <View style={s.receiptRow}>
                        <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>From</AppText>
                        <AppText variant="labelMD" style={{ color: colors.text.secondary, fontWeight: '700' }}>
                          {fromAccount?.name}
                        </AppText>
                      </View>

                      <View style={s.receiptRow}>
                        <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>To</AppText>
                        <AppText variant="labelMD" style={{ color: colors.text.secondary, fontWeight: '700' }}>
                          {toAccount?.name}
                        </AppText>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {accounts.length < 2 ? (
              <View style={s.emptyContainer}>
                <LinearGradient
                  colors={colors.gradients.purpleBlue}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.emptyIconGlow}
                >
                  <Ionicons name="swap-horizontal" size={36} color={colors.white} />
                </LinearGradient>

                <AppText variant="headingSM" style={[s.emptyTitle, { color: colors.text.primary }]}>
                  Two Accounts Required
                </AppText>

                <AppText variant="bodyMD" style={[s.emptyDesc, { color: colors.text.secondary }]}>
                  You need at least two checking, savings, or cash accounts to transfer funds between them.
                </AppText>

                <Pressable
                  onPress={handleCreateAccount}
                  style={({ pressed }) => [
                    s.emptyBtn,
                    {
                      backgroundColor: brandColor,
                      opacity: pressed ? 0.85 : 1,
                      shadowColor: brandColor,
                    }
                  ]}
                >
                  <Ionicons name="add-circle" size={20} color={colors.brand.onPrimary} />
                  <AppText style={[s.emptyBtnText, { color: colors.brand.onPrimary }]}>
                    Create Account
                  </AppText>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Header Title */}
                <View style={s.headerRow}>
                  <AppText variant="headingSM" color={colors.text.primary} style={{ fontWeight: '800' }}>
                    Transfer Funds
                  </AppText>
                  <Pressable onPress={onClose} hitSlop={8}>
                    <Ionicons name="close-circle" size={24} color={colors.text.tertiary} />
                  </Pressable>
                </View>

                {/* Animated Route Flow Visualizer */}
                <View style={[s.routeCard, { backgroundColor: isDark ? colors.glass.background : colors.background.primary, borderColor: colors.glass.border }]}>
                  {/* From Account block */}
                  <View style={s.routeBlock}>
                    <AppText variant="labelSM" color={colors.text.tertiary}>FROM</AppText>
                    {fromAccount ? (
                      <View style={s.routeAccountContent}>
                        <View style={[s.accountBadgeIcon, { backgroundColor: fromAccount.color + '22' }]}>
                          <Ionicons name={fromAccount.icon as any} size={14} color={fromAccount.color} />
                        </View>
                        <AppText variant="labelMD" numberOfLines={1} style={{ color: colors.text.primary, fontWeight: '700' }}>
                          {fromAccount.name}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.text.secondary, fontSize: 10 }}>
                          {activeSymbol}{fromAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </AppText>
                      </View>
                    ) : (
                      <AppText variant="caption" color={colors.text.tertiary}>Select Account</AppText>
                    )}
                  </View>

                  {/* Swap Button Circle */}
                  <Pressable onPress={handleSwapPress} style={s.swapBtnContainer}>
                    <Animated.View style={[s.swapBtnCircle, swapIconStyle, { backgroundColor: brandColor, shadowColor: brandColor }]}>
                      <Ionicons name="swap-horizontal" size={16} color={colors.white} />
                    </Animated.View>
                  </Pressable>

                  {/* To Account block */}
                  <View style={s.routeBlock}>
                    <AppText variant="labelSM" color={colors.text.tertiary} align="right">TO</AppText>
                    {toAccount ? (
                      <View style={[s.routeAccountContent, { alignItems: 'flex-end' }]}>
                        <View style={[s.accountBadgeIcon, { backgroundColor: toAccount.color + '22' }]}>
                          <Ionicons name={toAccount.icon as any} size={14} color={toAccount.color} />
                        </View>
                        <AppText variant="labelMD" numberOfLines={1} style={{ color: colors.text.primary, fontWeight: '700' }}>
                          {toAccount.name}
                        </AppText>
                        <AppText variant="caption" style={{ color: colors.text.secondary, fontSize: 10 }}>
                          {CURRENCY_SYMBOLS[toAccount.currency] ?? '$'}{toAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </AppText>
                      </View>
                    ) : (
                      <AppText variant="caption" color={colors.text.tertiary} align="right">Select Account</AppText>
                    )}
                  </View>
                </View>

                {/* Amount display */}
                <View style={s.amountSection}>
                  <AppText style={[s.amountDisplay, { color: brandColor }]}>
                    {activeSymbol}{amountDisplay}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.text.tertiary }}>
                    {activeCurrency}
                  </AppText>
                </View>

                {/* Numpad input */}
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
                            backgroundColor: isBackspace ? brandColor + '15' : (isDark ? colors.glass.background : colors.background.primary),
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                      >
                        {isBackspace ? (
                          <Ionicons name="backspace-outline" size={22} color={brandColor} />
                        ) : (
                          <AppText style={[s.numKeyText, { color: isDot ? colors.text.secondary : colors.text.primary }]}>
                            {key}
                          </AppText>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Selection Horizontal Carousels */}
                <View style={s.selectorsSection}>
                  <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary }]}>FROM ACCOUNT</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContainer}>
                    {accounts.map((acc) => {
                      const active = fromAccountId === acc.id;
                      const disabled = toAccountId === acc.id;
                      return (
                        <Pressable
                          key={`from-${acc.id}`}
                          disabled={disabled}
                          onPress={() => { setFromAccountId(acc.id); Haptics.selectionAsync(); }}
                          style={[
                            s.accountChip,
                            {
                              backgroundColor: active ? acc.color + '1A' : inputBg,
                              borderColor: active ? acc.color + '60' : colors.glass.border,
                              opacity: disabled ? 0.35 : 1,
                              borderWidth: active ? 1.5 : 1,
                            },
                          ]}
                        >
                          <View style={[s.accountIcon, { backgroundColor: acc.color + '22' }]}>
                            <Ionicons name={acc.icon as any} size={12} color={acc.color} />
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

                  <AppText variant="labelSM" style={[s.sectionLabel, { color: colors.text.tertiary, marginTop: 12 }]}>TO ACCOUNT</AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scrollContainer}>
                    {accounts.map((acc) => {
                      const active = toAccountId === acc.id;
                      const disabled = fromAccountId === acc.id;
                      return (
                        <Pressable
                          key={`to-${acc.id}`}
                          disabled={disabled}
                          onPress={() => { setToAccountId(acc.id); Haptics.selectionAsync(); }}
                          style={[
                            s.accountChip,
                            {
                              backgroundColor: active ? acc.color + '1A' : inputBg,
                              borderColor: active ? acc.color + '60' : colors.glass.border,
                              opacity: disabled ? 0.35 : 1,
                              borderWidth: active ? 1.5 : 1,
                            },
                          ]}
                        >
                          <View style={[s.accountIcon, { backgroundColor: acc.color + '22' }]}>
                            <Ionicons name={acc.icon as any} size={12} color={acc.color} />
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

                {/* Optional Note */}
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
                  placeholder="Transfer note (optional)"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={80}
                />

                {/* Submit button */}
                <Pressable
                  onPress={handleSave}
                  style={({ pressed }) => [s.addBtn, { backgroundColor: brandColor, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Ionicons name="swap-horizontal" size={20} color={colors.brand.onPrimary} />
                  <AppText style={[s.addBtnText, { color: colors.brand.onPrimary }]}>
                    Transfer Funds
                  </AppText>
                </Pressable>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 8, paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: 8,
  },
  routeBlock: { flex: 1 },
  routeAccountContent: { marginTop: 6, gap: 2 },
  accountBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  swapBtnContainer: { paddingHorizontal: 12, zIndex: 10 },
  swapBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
  amountSection: { alignItems: 'center', paddingVertical: 4, marginBottom: 8 },
  amountDisplay: { fontSize: 36, fontWeight: '800', letterSpacing: -1, lineHeight: 44 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  numKey: { width: '30%', flexGrow: 1, height: 48, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  numKeyText: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  sectionLabel: { letterSpacing: 1, fontSize: 10, fontWeight: '700', marginBottom: 6, marginLeft: 2 },
  scrollContainer: { gap: 8, paddingBottom: 4, paddingRight: 8 },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  accountIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectorsSection: { marginBottom: 12 },
  noteInput: { height: 40, borderRadius: Radius.lg, paddingHorizontal: 14, fontSize: 13, borderWidth: 1, marginBottom: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: Radius.lg, marginTop: 4 },
  addBtnText: { fontWeight: '700', fontSize: 15 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16, gap: 16 },
  emptyIconGlow: {
    width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 6 },
    }),
  },
  emptyTitle: { fontWeight: '800', textAlign: 'center', marginTop: 8 },
  emptyDesc: { textAlign: 'center', lineHeight: 20, paddingHorizontal: 12 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: Radius.lg, paddingHorizontal: 20, width: '100%', marginTop: 8,
    ...Platform.select({
      ios: { shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 3 },
    }),
  },
  emptyBtnText: { fontWeight: '700', fontSize: 16 },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  feedbackContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  spinnerContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptCard: {
    width: '100%',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 24,
    gap: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});