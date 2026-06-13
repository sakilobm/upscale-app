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
import { Spacing, Radius } from '@constants/Dimensions';
import { daysUntilDue, isUrgent } from '@store/plannedPaymentsStore';
import type { PlannedPayment } from '@store/plannedPaymentsStore';

// ─── Category icons ───────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const CATEGORY_ICON: Record<string, IoniconName> = {
  housing:       'home-outline',
  food:          'restaurant-outline',
  transport:     'car-outline',
  health:        'fitness-outline',
  entertainment: 'film-outline',
  shopping:      'bag-handle-outline',
  education:     'school-outline',
  savings:       'wallet-outline',
  other:         'ellipsis-horizontal-outline',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROW_HEIGHT   = 76;
const SWIPE_SETTLE = 80;  // px to trigger settle
const LOCK_MS      = 3000; // auto-lock after 3 s if not swiped

// ─── Single payment row ───────────────────────────────────────────────────────

interface PaymentRowProps {
  payment:  PlannedPayment;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

function PaymentRow({ payment, onSettle, onDelete }: PaymentRowProps) {
  const { colors, isDark } = useTheme();

  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const rowHeight  = useSharedValue(ROW_HEIGHT + Spacing['2']);
  const glowOp     = useSharedValue(0); // pulse glow when unlocked

  // JS-thread unlock flag — drives enabled state of pan gesture
  const [isUnlocked, setIsUnlocked] = useState(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const days   = daysUntilDue(payment.dueDate);
  const urgent = isUrgent(payment.dueDate);

  const dotColor =
    payment.status === 'SETTLED' ? colors.status.income :
    payment.status === 'OVERDUE' ? colors.status.expense :
    urgent ? '#F59E0B' : colors.status.info;

  // ── Collapse row then call action
  const dismissRow = (action: () => void) => {
    rowOpacity.value = withTiming(0, { duration: 220 });
    rowHeight.value  = withTiming(0, { duration: 300 });
    setTimeout(action, 300);
  };

  const handleSettle = () => dismissRow(() => onSettle(payment.id));
  const handleDelete = () => dismissRow(() => onDelete(payment.id));

  // ── Unlock via long press
  const unlock = () => {
    if (payment.status === 'SETTLED') return;
    setIsUnlocked(true);
    glowOp.value = withTiming(1, { duration: 180 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      // Auto-lock only if row hasn't moved
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

  // ── Pan: only moves when unlocked
  const panGesture = Gesture.Pan()
    .enabled(isUnlocked && payment.status !== 'SETTLED')
    .activeOffsetX([8, 8000])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      // Allow swiping right (settle) or back left to cancel
      translateX.value = Math.min(Math.max(e.translationX, 0), 140);
    })
    .onEnd((e) => {
      if (e.translationX >= SWIPE_SETTLE) {
        // Confirmed — animate out then settle
        translateX.value = withTiming(170, { duration: 200 });
        setTimeout(() => {
          lock();
          handleSettle();
        }, 100);
      } else {
        // Didn't swipe far enough — spring back, stay unlocked
        translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
      }
    });

  // ── Animated styles
  const rowStyle    = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const wrapStyle   = useAnimatedStyle(() => ({ opacity: rowOpacity.value, height: rowHeight.value }));
  const underlayOp  = useAnimatedStyle(() => ({ opacity: Math.min(translateX.value / SWIPE_SETTLE, 1) }));
  const glowStyle   = useAnimatedStyle(() => ({ opacity: glowOp.value }));

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Animated.View style={wrapStyle}>

      {/* Settle underlay */}
      {payment.status !== 'SETTLED' && (
        <Animated.View
          style={[
            styles.underlaySettle,
            underlayOp,
            { backgroundColor: colors.status.income, height: ROW_HEIGHT },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <AppText variant="labelSM" style={styles.underlayText}>Settle</AppText>
        </Animated.View>
      )}

      {/* Unlock glow ring */}
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
          style={{ zIndex: 1 }}
        >
          <Animated.View
            style={[
              styles.row,
              rowStyle,
              {
                height:          ROW_HEIGHT,
                backgroundColor: cardBg,
                borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
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
                {/* Hold hint — only shows when row is NOT unlocked */}
                {payment.status !== 'SETTLED' && !isUnlocked && (
                  <View style={[styles.holdHint, { backgroundColor: colors.text.tertiary + '18' }]}>
                    <AppText style={{ fontSize: 9, color: colors.text.tertiary, fontWeight: '600', letterSpacing: 0.3 }}>
                      HOLD
                    </AppText>
                  </View>
                )}
                {/* Unlocked indicator */}
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

            {/* Amount + delete */}
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
                ${payment.amount.toFixed(2)}
              </AppText>
              {payment.status !== 'SETTLED' && (
                <Pressable
                  onPress={handleDelete}
                  hitSlop={12}
                  style={[styles.deleteBtn, { backgroundColor: colors.status.expense + '18' }]}
                >
                  <Ionicons name="close" size={12} color={colors.status.expense} />
                </Pressable>
              )}
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
      <View style={styles.titleRow}>
        <AppText variant="headingSM" color={colors.text.primary}>Planned Payments</AppText>
        <View style={[styles.hint, { backgroundColor: colors.brand.primary + '15', borderColor: colors.brand.primary + '30' }]}>
          <Ionicons name="hand-left-outline" size={11} color={colors.brand.primary} />
          <AppText variant="labelSM" style={{ color: colors.brand.primary, fontSize: 10, fontWeight: '600' }}>
            Hold to settle
          </AppText>
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
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  hint: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  list: { gap: Spacing['2'] },

  // Swipe underlay
  underlaySettle: {
    position:      'absolute',
    left:          0,
    right:         0,
    top:           0,
    borderRadius:  Radius.xl,
    flexDirection: 'row',
    alignItems:    'center',
    paddingLeft:   Spacing['5'],
    gap:           Spacing['2'],
  },
  underlayText: { color: '#FFFFFF', fontWeight: '700' },

  // Unlock glow ring (border highlight when hold is active)
  unlockGlow: {
    position:     'absolute',
    left:         0,
    right:        0,
    top:          0,
    borderRadius: Radius.xl,
    borderWidth:  2,
    zIndex:       2,
  },

  // Row card
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius:      Radius.xl,
    borderWidth:       1,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  dot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  iconBox: {
    width: 36, height: 36, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  body:        { flex: 1, gap: 3 },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  holdHint: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      4,
  },
  right:  { alignItems: 'flex-end', gap: 5, flexShrink: 0 },
  amount: { fontSize: 14, fontWeight: '700' },
  deleteBtn: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
});
