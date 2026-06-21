import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Switch,
  Alert,
} from 'react-native';
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
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { Radius, Spacing } from '@constants/Dimensions';
import { loanProgress, daysUntilPayment } from '@store/loansStore';
import type { Loan } from '@store/loansStore';

interface Props {
  loan:            Loan | undefined;
  onClose:         () => void;
  onRecordPayment: (id: string) => void;
  onDelete:        (id: string) => void;
  onEdit:          (loan: Loan) => void;
  onToggleReminder:(id: string, enabled: boolean, time: string) => Promise<void>;
}

export function LoanInfoSheet({
  loan,
  onClose,
  onRecordPayment,
  onDelete,
  onEdit,
  onToggleReminder,
}: Props) {
  const { colors, isDark } = useTheme();
  const { symbol }         = useFormatCurrency();
  
  const account = useAccountStore((s) =>
    s.accounts.find((a) => a.id === loan?.accountId)
  );

  const translateY  = useSharedValue(600);
  const backdropOp  = useSharedValue(0);
  const visible     = !!loan;

  const [reminders, setReminders] = useState(false);
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (visible && loan) {
      setReminders(loan.remindersEnabled ?? false);
      setTime(loan.reminderTime ?? '09:00');
      backdropOp.value = withTiming(1,   { duration: 220 });
      translateY.value = withSpring(0,   { damping: 22, stiffness: 160, mass: 0.9 });
    } else {
      backdropOp.value = withTiming(0,   { duration: 180 });
      translateY.value = withSpring(600, { damping: 20, stiffness: 200 });
    }
  }, [visible, loan]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  if (!loan) return null;

  const progress    = loanProgress(loan);
  const days        = daysUntilPayment(loan);
  const remaining   = loan.principalAmount - loan.amountPaid;
  const isLate      = days < 0;
  const isUrgent    = days >= 0 && days <= 7;

  const typeColor   = loan.type === 'BORROWED' ? colors.status.expense : colors.status.income;
  const statusColor = isLate ? colors.status.expense : isUrgent ? colors.status.warning : colors.status.income;

  const stats = [
    { label: 'Principal', value: loan.principalAmount },
    { label: 'Repaid',    value: loan.amountPaid, color: colors.status.income },
    { label: 'Remaining', value: remaining, color: remaining > 0 ? typeColor : colors.status.income },
  ];

  const handleReminderToggle = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setReminders(val);
    try {
      await onToggleReminder(loan.id, val, time);
    } catch (e: any) {
      setReminders(!val);
      Alert.alert('Permission Required', e?.message || 'Failed to enable reminders');
    }
  };

  const handleConfirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    Alert.alert(
      'Delete Loan Contract',
      `Are you sure you want to permanently delete the loan "${loan.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(loan.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay.heavy }, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          {
            backgroundColor: colors.surface.sheet,
            borderColor:     colors.glass.backgroundMid,
            shadowColor:     colors.black,
          },
          sheetStyle,
        ]}
      >
        {/* Blur & Glow Background */}
        <BlurView
          intensity={isDark ? 60 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.background.secondary, colors.background.primary]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, s.sheetBorder, { borderColor: colors.glass.border }]} pointerEvents="none" />

        {/* Handle */}
        <View style={[s.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

        {/* Header Row */}
        <View style={s.headerRow}>
          <View style={[s.cardIndicator, { backgroundColor: loan.color }]} />
          <View style={s.nameBlock}>
            <AppText variant="headingSM" color={colors.text.primary} numberOfLines={1}>
              {loan.name}
            </AppText>
            <AppText variant="caption" color={colors.text.tertiary}>
              with {loan.counterparty} · {loan.type === 'BORROWED' ? 'Borrowed' : 'Lent Out'}
            </AppText>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={[s.statsCard, { backgroundColor: colors.background.tertiary, borderColor: colors.glass.border }]}>
          {stats.map((stat, i) => (
            <View
              key={stat.label}
              style={[
                s.statCell,
                i < 2 && { borderRightWidth: 1, borderRightColor: colors.glass.border },
              ]}
            >
              <AppText style={[s.statValue, { color: stat.color || colors.text.primary }]}>
                {symbol}{stat.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={s.statLabel}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Repayment Progress */}
        <View style={s.progressSection}>
          <View style={s.progressHeader}>
            <AppText variant="labelSM" color={colors.text.secondary}>Repayment Progress</AppText>
            <AppText variant="labelSM" color={colors.text.primary} style={{ fontWeight: '700' }}>
              {Math.round(progress * 100)}%
            </AppText>
          </View>
          <View style={[s.progressTrack, { backgroundColor: colors.glass.background }]}>
            <View style={[s.progressFill, { width: `${progress * 100}%` as any, backgroundColor: loan.color }]} />
          </View>
          <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 4 }}>
            {loan.completedPayments} of {loan.totalPayments} installments paid
          </AppText>
        </View>

        {/* Details List */}
        <View style={[s.detailsList, { borderColor: colors.glass.border }]}>
          <View style={s.detailRow}>
            <Ionicons name="cash-outline" size={15} color={colors.text.tertiary} />
            <AppText variant="bodySM" color={colors.text.secondary} style={s.flex1}>EMI Installment</AppText>
            <AppText variant="labelSM" color={colors.text.primary} style={{ fontWeight: '700' }}>
              {symbol}{loan.emiAmount.toLocaleString()} / mo
            </AppText>
          </View>
          
          <View style={[s.divider, { backgroundColor: colors.glass.border }]} />

          <View style={s.detailRow}>
            <Ionicons name="trending-up-outline" size={15} color={colors.text.tertiary} />
            <AppText variant="bodySM" color={colors.text.secondary} style={s.flex1}>Interest Rate</AppText>
            <AppText variant="labelSM" color={colors.text.primary} style={{ fontWeight: '700' }}>
              {loan.interestRate}% P.A.
            </AppText>
          </View>

          <View style={[s.divider, { backgroundColor: colors.glass.border }]} />

          {account && (
            <>
              <View style={s.detailRow}>
                <Ionicons name={(account.icon as any) || "wallet-outline"} size={15} color={account.color} />
                <AppText variant="bodySM" color={colors.text.secondary} style={s.flex1}>Linked Account</AppText>
                <AppText variant="labelSM" style={{ color: account.color, fontWeight: '700' }}>
                  {account.name}
                </AppText>
              </View>
              <View style={[s.divider, { backgroundColor: colors.glass.border }]} />
            </>
          )}

          <View style={s.detailRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.text.tertiary} />
            <AppText variant="bodySM" color={colors.text.secondary} style={s.flex1}>Next Payment Date</AppText>
            <AppText variant="labelSM" color={statusColor} style={{ fontWeight: '700' }}>
              {loan.nextPaymentDate} ({isLate ? `${Math.abs(days)}d late` : `in ${days}d`})
            </AppText>
          </View>
        </View>

        {/* Reminders Toggle Section */}
        <View style={[s.reminderSection, { backgroundColor: colors.background.tertiary, borderColor: colors.glass.border }]}>
          <View style={s.flex1}>
            <AppText variant="labelSM" color={colors.text.primary} style={{ fontWeight: '700' }}>
              Repayment Reminders
            </AppText>
            <AppText variant="caption" color={colors.text.tertiary}>
              Alert at 9:00 AM on payment due date
            </AppText>
          </View>
          <Switch
            value={reminders}
            onValueChange={handleReminderToggle}
            trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.glass.backgroundMid}
          />
        </View>

        {/* Actions Row */}
        <View style={s.actions}>
          {loan.completedPayments < loan.totalPayments ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onRecordPayment(loan.id);
              }}
              style={[s.actionBtn, s.actionPrimary]}
            >
              <LinearGradient
                colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />
              <AppText style={[s.actionPrimaryText, { color: colors.white }]}>
                Record EMI Installment
              </AppText>
            </Pressable>
          ) : (
            <View style={[s.completedBanner, { backgroundColor: colors.status.income + '12', borderColor: colors.status.income + '30' }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.status.income} />
              <AppText variant="labelSM" style={{ color: colors.status.income, fontWeight: '700' }}>
                Loan Fully Repaid & Closed
              </AppText>
            </View>
          )}

          <View style={s.secondaryActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
                setTimeout(() => onEdit(loan), 250);
              }}
              style={[s.secBtn, { borderColor: colors.glass.border, backgroundColor: colors.glass.background }]}
            >
              <Ionicons name="create-outline" size={16} color={colors.text.secondary} />
              <AppText variant="labelSM" color={colors.text.secondary}>Edit</AppText>
            </Pressable>

            <Pressable
              onPress={handleConfirmDelete}
              style={[s.secBtn, { borderColor: colors.status.expense + '40', backgroundColor: colors.status.expense + '0B' }]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.status.expense} />
              <AppText variant="labelSM" style={{ color: colors.status.expense }}>Delete</AppText>
            </Pressable>
          </View>
        </View>
        <ToastContainer isModal />
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1, borderBottomWidth: 0,
    paddingHorizontal: Spacing['5'],
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    gap: Spacing['4'],
    overflow: 'hidden',
  },
  sheetBorder: {
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  handle:  { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], marginTop: Spacing['1'] },
  cardIndicator: { width: 14, height: 14, borderRadius: 7 },
  nameBlock: { flex: 1 },
  closeBtn: { padding: 4 },
  flex1: { flex: 1 },

  statsCard: { flexDirection: 'row', borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  statCell:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, fontWeight: '500', letterSpacing: 0.3 },

  progressSection: { gap: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill:  { height: 6, borderRadius: 3 },

  detailsList: { borderWidth: 1, borderRadius: Radius.xl, overflow: 'hidden', paddingHorizontal: Spacing['4'] },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: Spacing['3'] },
  divider: { height: StyleSheet.hairlineWidth },

  reminderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: 12,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },

  actions: { gap: 12, marginTop: Spacing['1'] },
  actionBtn: {
    height: 52,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  actionPrimary: {},
  actionPrimaryText: { fontWeight: '700', fontSize: 15 },
  
  completedBanner: {
    height: 52,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },

  secondaryActions: { flexDirection: 'row', gap: 12 },
  secBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
});
