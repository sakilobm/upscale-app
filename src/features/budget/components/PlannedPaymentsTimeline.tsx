import React from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
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

// ─── Row height ───────────────────────────────────────────────────────────────

const ROW_HEIGHT = 76;
const SWIPE_SETTLE = 72;

// ─── Single payment row ───────────────────────────────────────────────────────

interface PaymentRowProps {
  payment:  PlannedPayment;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

function PaymentRow({ payment, onSettle, onDelete }: PaymentRowProps) {
  const { colors, isDark } = useTheme();

  const translateX  = useSharedValue(0);
  const rowOpacity  = useSharedValue(1);
  const rowHeight   = useSharedValue(ROW_HEIGHT + Spacing['2']); // include gap

  const days   = daysUntilDue(payment.dueDate);
  const urgent = isUrgent(payment.dueDate);

  const dotColor =
    payment.status === 'SETTLED' ? colors.status.income :
    payment.status === 'OVERDUE' ? colors.status.expense :
    urgent ? '#F59E0B' : colors.status.info;

  const dismissRow = (action: () => void) => {
    rowOpacity.value = withTiming(0, { duration: 220 });
    rowHeight.value  = withTiming(0, { duration: 280 }, () => {
      runOnJS(action)();
    });
  };

  const handleSettle = () => dismissRow(() => onSettle(payment.id));
  const handleDelete = () => dismissRow(() => onDelete(payment.id));

  // ── Swipe-right → settle
  // activeOffsetX: need 20px horizontal before activating
  // failOffsetY:   fail immediately on 4px vertical → scroll wins
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .activeOffsetX([20, 20000])
    .failOffsetY([-4, 4])
    .onUpdate((e) => {
      if (payment.status === 'SETTLED') return;
      translateX.value = Math.min(Math.max(e.translationX, 0), 130);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_SETTLE && payment.status !== 'SETTLED') {
        translateX.value = withTiming(160, { duration: 180 });
        runOnJS(handleSettle)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 260 });
      }
    });

  const rowStyle   = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const wrapStyle  = useAnimatedStyle(() => ({
    opacity:  rowOpacity.value,
    height:   rowHeight.value,
  }));
  // underlay fades in as row moves right
  const underlayStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_SETTLE, 1),
  }));

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Animated.View style={wrapStyle}>
      {/* Settle underlay (revealed behind row on swipe right) */}
      {payment.status !== 'SETTLED' && (
        <Animated.View
          style={[
            styles.underlaySettle,
            underlayStyle,
            { backgroundColor: colors.status.income, height: ROW_HEIGHT },
          ]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <AppText variant="labelSM" style={styles.underlayText}>Settle</AppText>
        </Animated.View>
      )}

      <GestureDetector gesture={panGesture}>
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
            <AppText variant="caption" color={colors.text.tertiary}>
              {payment.status === 'SETTLED'
                ? '✓ Settled'
                : payment.status === 'OVERDUE'
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? 'Due today'
                : `Due in ${days}d`}
              {payment.isRecurring ? '  ·  ↻ recurring' : ''}
            </AppText>
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

export function PlannedPaymentsTimeline({
  payments,
  onSettle,
  onDelete,
}: PlannedPaymentsTimelineProps) {
  const { colors } = useTheme();

  const sorted = [...payments].sort((a, b) => {
    if (a.status === 'SETTLED' && b.status !== 'SETTLED') return 1;
    if (b.status === 'SETTLED' && a.status !== 'SETTLED') return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  if (!sorted.length) return null;

  return (
    <View style={styles.container}>
      {/* Section title */}
      <View style={styles.titleRow}>
        <AppText variant="headingSM" color={colors.text.primary}>
          Planned Payments
        </AppText>
        <View style={[styles.hint, { backgroundColor: colors.brand.primary + '18' }]}>
          <AppText variant="labelSM" style={{ color: colors.brand.accent, fontSize: 10 }}>
            Swipe → to settle
          </AppText>
        </View>
      </View>

      {/* Rows */}
      <View style={styles.list}>
        {sorted.map((p) => (
          <PaymentRow
            key={p.id}
            payment={p}
            onSettle={onSettle}
            onDelete={onDelete}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing['3'],
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  hint: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      Radius.full,
  },
  list: {
    gap: Spacing['2'],
  },
  // ── Swipe underlay
  underlaySettle: {
    position:       'absolute',
    left:           0,
    right:          0,
    top:            0,
    borderRadius:   Radius.xl,
    flexDirection:  'row',
    alignItems:     'center',
    paddingLeft:    Spacing['5'],
    gap:            Spacing['2'],
  },
  underlayText: {
    color:      '#FFFFFF',
    fontWeight: '700',
  },
  // ── Row card
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius:      Radius.xl,
    borderWidth:       1,
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius:  8,
      },
      android: { elevation: 1 },
    }),
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  iconBox: {
    width:          36,
    height:         36,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  body: {
    flex: 1,
    gap:  3,
  },
  right: {
    alignItems: 'flex-end',
    gap:        5,
    flexShrink: 0,
  },
  amount: {
    fontSize:   14,
    fontWeight: '700',
  },
  deleteBtn: {
    width:          22,
    height:         22,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
