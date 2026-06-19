import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { Spacing, Radius } from '@constants/Dimensions';
import { daysUntilDue, isUrgent } from '@store/plannedPaymentsStore';
import type { PlannedPayment } from '@store/plannedPaymentsStore';

// ─── Category icons ───────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<string, IoniconName> = {
  housing: 'home-outline',
  food: 'restaurant-outline',
  transport: 'car-outline',
  health: 'fitness-outline',
  entertainment: 'film-outline',
  shopping: 'bag-handle-outline',
  education: 'school-outline',
  savings: 'wallet-outline',
  other: 'ellipsis-horizontal-outline',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT = 76;
const SWIPE_SETTLE = 80;   // px rightward to trigger settle (after unlock)
const LOCK_MS = 3000; // auto-lock after 3 s
const TX_DELETE_W = 84;   // width of the revealed delete zone
const TX_SNAP_AT = TX_DELETE_W / 2;  // snap open if past this
const TX_AUTO_DELETE = 190;  // full swipe left → auto-delete immediately

// ─── Single payment row ───────────────────────────────────────────────────────

interface PaymentRowProps {
  payment: PlannedPayment;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

function PaymentRow({ payment, onSettle, onDelete }: PaymentRowProps) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const account = useAccountStore((s) => s.accounts.find((a) => a.id === payment.accountId));

  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const rowHeight = useSharedValue(ROW_HEIGHT + Spacing['2']);
  const glowOp = useSharedValue(0);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const days = daysUntilDue(payment.dueDate);
  const urgent = isUrgent(payment.dueDate);

  const dotColor =
    payment.status === 'SETTLED' ? colors.status.income :
      payment.status === 'OVERDUE' ? colors.status.expense :
        urgent ? colors.status.warning : colors.status.info;

  // ── Collapse + call action (used for settle)
  const dismissRow = (action: () => void) => {
    rowOpacity.value = withTiming(0, { duration: 220 });
    rowHeight.value = withTiming(0, { duration: 300 });
    setTimeout(action, 300);
  };

  // ── Slide left + collapse (used for delete)
  const dismissLeft = () => {
    translateX.value = withTiming(-500, { duration: 260 });
    rowOpacity.value = withTiming(0, { duration: 200 });
    rowHeight.value = withTiming(0, { duration: 280 });
    if (isUnlocked) lock();
    setTimeout(() => onDelete(payment.id), 250);
  };

  const handleSettle = () => dismissRow(() => onSettle(payment.id));

  // ── Long-press unlock (for settle gesture)
  const unlock = () => {
    if (payment.status === 'SETTLED') return;
    setIsUnlocked(true);
    glowOp.value = withTiming(1, { duration: 180 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      setIsUnlocked(false);
      glowOp.value = withTiming(0, { duration: 200 });
      translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
    }, LOCK_MS);
  };

  const lock = () => {
    setIsUnlocked(false);
    glowOp.value = withTiming(0, { duration: 150 });
    if (lockTimer.current) clearTimeout(lockTimer.current);
  };

  // ── Unified pan: left = delete (always), right = settle (requires unlock)
  const panGesture = Gesture.Pan()
    .enabled(payment.status !== 'SETTLED')
    .runOnJS(true)
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        // Left swipe → delete direction (no unlock needed)
        translateX.value = Math.max(e.translationX, -(TX_DELETE_W + 12));
      } else {
        // Right swipe → settle direction (unlock required)
        if (isUnlocked) {
          translateX.value = Math.min(e.translationX, 140);
        }
        // If not unlocked, resist rightward movement (no visual shift)
      }
    })
    .onEnd((e) => {
      if (e.translationX >= SWIPE_SETTLE && isUnlocked) {
        // ── Settle: swiped right far enough while unlocked
        translateX.value = withTiming(170, { duration: 200 });
        setTimeout(() => { lock(); handleSettle(); }, 100);

      } else if (e.translationX < 0) {
        // ── Delete direction
        if (e.velocityX < -700 || e.translationX < -TX_AUTO_DELETE) {
          // Fast flick OR long swipe → auto-delete
          dismissLeft();
        } else if (e.translationX < -TX_SNAP_AT) {
          // Past halfway → snap open, show delete button
          translateX.value = withSpring(-TX_DELETE_W, { damping: 20, stiffness: 200 });
        } else {
          // Short swipe → snap back
          translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        }

      } else {
        // Right swipe but not far enough or not unlocked → snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
      }
    });

  // ── Animated styles
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const wrapStyle = useAnimatedStyle(() => ({ opacity: rowOpacity.value, height: rowHeight.value }));
  // Settle underlay: fades in as card slides RIGHT
  const settleOp = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / SWIPE_SETTLE, 0), 1),
  }));
  // Delete underlay: fades in as card slides LEFT
  const deleteOp = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateX.value / (TX_DELETE_W * 0.55), 0), 1),
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const cardBg = colors.surface.sheet;

  return (
    <Animated.View style={wrapStyle}>

      {/* ── Settle underlay (left side, revealed on rightward swipe) ── */}
      {payment.status !== 'SETTLED' && (
        <Animated.View
          style={[
            styles.underlaySettle,
            settleOp,
            { backgroundColor: colors.status.income, height: ROW_HEIGHT },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
          <AppText variant="labelSM" style={[styles.underlayText, { color: colors.white }]}>Settle</AppText>
        </Animated.View>
      )}

      {/* ── Delete underlay (right side, revealed on leftward swipe) ── */}
      {payment.status !== 'SETTLED' && (
        <Animated.View
          style={[
            styles.underlayDelete,
            deleteOp,
            { backgroundColor: colors.status.expense, height: ROW_HEIGHT },
          ]}
        >
          <Pressable onPress={dismissLeft} style={styles.underlayDeletePressable}>
            <AppText variant="labelSM" style={[styles.underlayText, { color: colors.white }]}>Delete</AppText>
            <Ionicons name="trash-outline" size={18} color={colors.white} />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Unlock glow ring ── */}
      {payment.status !== 'SETTLED' && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.unlockGlow,
            { borderColor: colors.status.income, height: ROW_HEIGHT },
            glowStyle,
          ]}
        />
      )}

      <GestureDetector gesture={panGesture}>
        <Pressable
          onLongPress={unlock}
          delayLongPress={340}
          disabled={payment.status === 'SETTLED'}
          onPress={() => {
            // If row is open (swiped left), tap card to close
            if (translateX.value < -8) {
              translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
            }
          }}
          style={{ zIndex: 1 }}
        >
          <Animated.View
            style={[
              styles.row,
              rowStyle,
              {
                height: ROW_HEIGHT,
                backgroundColor: cardBg,
                borderColor: colors.glass.background,
                shadowColor: colors.black,
              },
            ]}
          >
            {/* Timeline dot */}
            <View style={[styles.dot, { backgroundColor: dotColor }]} />

            {/* Category icon */}
            <View style={[styles.iconBox, { backgroundColor: dotColor + (isDark ? '28' : '18') }]}>
              <Ionicons
                name={CATEGORY_ICON[payment.category] ?? 'ellipsis-horizontal-outline'}
                size={16}
                color={dotColor}
              />
            </View>

            {/* Text body */}
            <View style={styles.body}>
              <AppText variant="labelMD" color={colors.text.primary} numberOfLines={1}>
                {payment.title}
              </AppText>
              <View style={styles.subtitleRow}>
                {account && (
                  <View style={[styles.accountBadge, { backgroundColor: account.color + '15' }]}>
                    <Ionicons name={account.icon as any} size={9} color={account.color} />
                    <AppText style={[styles.accountLabel, { color: account.color }]}>
                      {account.name}
                    </AppText>
                  </View>
                )}

                <AppText variant="caption" color={colors.text.tertiary}>
                  {payment.status === 'SETTLED'
                    ? '✓ Settled'
                    : payment.status === 'OVERDUE'
                      ? `${Math.abs(days)}d overdue`
                      : days === 0
                        ? 'Due today'
                        : `Due in ${days}d`}
                  {payment.isRecurring ? '  ·  ↻' : ''}
                </AppText>

                {/* State hint badges */}
                {payment.status !== 'SETTLED' && !isUnlocked && (
                  <View style={[styles.holdHint, { backgroundColor: colors.text.tertiary + '18' }]}>
                    <AppText style={{ fontSize: 9, color: colors.text.tertiary, fontWeight: '600', letterSpacing: 0.3 }}>
                      HOLD
                    </AppText>
                  </View>
                )}
                {payment.status !== 'SETTLED' && isUnlocked && (
                  <View style={[styles.holdHint, { backgroundColor: colors.status.income + '20' }]}>
                    <Ionicons name="arrow-forward" size={9} color={colors.status.income} />
                    <AppText style={{ fontSize: 9, color: colors.status.income, fontWeight: '700', letterSpacing: 0.3 }}>
                      SWIPE
                    </AppText>
                  </View>
                )}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.right}>
              <AppText
                variant="labelLG"
                style={[
                  styles.amount,
                  {
                    color: payment.status === 'SETTLED'
                      ? colors.status.income
                      : payment.status === 'OVERDUE'
                        ? colors.status.expense
                        : colors.text.primary,
                  },
                ]}
              >
                {symbol}{payment.amount.toFixed(2)}
              </AppText>
            </View>
          </Animated.View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface PlannedPaymentsTimelineProps {
  payments: PlannedPayment[];
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PlannedPaymentsTimeline({ payments, onSettle, onDelete }: PlannedPaymentsTimelineProps) {
  const { colors } = useTheme();

  const sorted = [...payments].sort((a, b) => {
    if (a.status === 'SETTLED' && b.status !== 'SETTLED') return 1;
    if (b.status === 'SETTLED' && a.status !== 'SETTLED') return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (!sorted.length) return null;

  return (
    <View style={styles.container}>
      {/* Title + dual gesture hints */}
      <View style={styles.titleRow}>
        <AppText variant="headingSM" color={colors.text.primary}>Planned Payments</AppText>
        <View style={styles.hintGroup}>
          <View style={[styles.hint, { backgroundColor: colors.status.expense + '12', borderColor: colors.status.expense + '30' }]}>
            <Ionicons name="arrow-back-outline" size={10} color={colors.status.expense} />
            <AppText style={{ color: colors.status.expense, fontSize: 9, fontWeight: '700' }}>Delete</AppText>
          </View>
          <View style={[styles.hint, { backgroundColor: colors.brand.primary + '15', borderColor: colors.brand.primary + '30' }]}>
            <Ionicons name="hand-left-outline" size={10} color={colors.brand.primary} />
            <AppText style={{ color: colors.brand.primary, fontSize: 9, fontWeight: '700' }}>Hold settle</AppText>
          </View>
        </View>
      </View>

      <View style={styles.list}>
        {sorted.map((p) => (
          <PaymentRow key={p.id} payment={p} onSettle={onSettle} onDelete={onDelete} />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing['3'] },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  list: { gap: Spacing['2'] },

  // ── Underlays ──────────────────────────────────────────────────────────────

  // Left underlay (green, settle — slides in as card moves right)
  underlaySettle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing['5'],
    gap: Spacing['2'],
  },
  // Right underlay (red, delete — slides in as card moves left)
  underlayDelete: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: TX_DELETE_W + 20,
    borderRadius: Radius.xl,
  },
  underlayDeletePressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing['5'],
    gap: Spacing['2'],
  },
  underlayText: { fontWeight: '700', fontSize: 13 },

  // ── Glow ring ─────────────────────────────────────────────────────────────
  unlockGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderRadius: Radius.xl,
    borderWidth: 2,
    zIndex: 2,
  },

  // ── Row card ───────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  iconBox: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body: { flex: 1, gap: 3 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  holdHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  accountLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  right: { alignItems: 'flex-end', flexShrink: 0 },
  amount: { fontSize: 14, fontWeight: '700' },
});
