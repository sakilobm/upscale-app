import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
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

// ─── Single payment row ───────────────────────────────────────────────────────

const SWIPE_SETTLE_THRESHOLD = 80;

interface PaymentRowProps {
  payment:   PlannedPayment;
  onSettle:  (id: string) => void;
  onDelete:  (id: string) => void;
}

function PaymentRow({ payment, onSettle, onDelete }: PaymentRowProps) {
  const { colors, isDark } = useTheme();

  const translateX = useSharedValue(0);
  const opacity    = useSharedValue(1);
  const height     = useSharedValue(68);

  const days     = daysUntilDue(payment.dueDate);
  const urgent   = isUrgent(payment.dueDate);

  const dotColor =
    payment.status === 'SETTLED' ? colors.status.income :
    payment.status === 'OVERDUE' ? colors.status.expense :
    urgent ? '#F59E0B' : colors.status.info;

  const handleSettle = () => {
    // Animate out then settle
    opacity.value = withTiming(0, { duration: 250 });
    height.value  = withTiming(0, { duration: 300 }, () => {
      runOnJS(onSettle)(payment.id);
    });
  };

  const handleDelete = () => {
    opacity.value = withTiming(0, { duration: 250 });
    height.value  = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDelete)(payment.id);
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([SWIPE_SETTLE_THRESHOLD, 1000])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = Math.min(e.translationX, 150);
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_SETTLE_THRESHOLD && payment.status !== 'SETTLED') {
        translateX.value = withSequence(
          withTiming(160, { duration: 200 }),
          withTiming(0, { duration: 0 })
        );
        runOnJS(handleSettle)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
      }
    });

  const rowStyle    = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const wrapStyle   = useAnimatedStyle(() => ({
    opacity:  opacity.value,
    height:   height.value,
    overflow: 'hidden',
  }));

  const cardBg = isDark
    ? 'rgba(15, 21, 36, 0.85)'
    : 'rgba(255, 255, 255, 0.95)';

  return (
    <Animated.View style={wrapStyle}>
      {/* Swipe-right: settle revealed underlay */}
      <View style={[styles.swipeUnderlay, { backgroundColor: colors.status.income }]}>
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
        <AppText variant="labelSM" style={{ color: '#fff' }}>Settle</AppText>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.row,
            rowStyle,
            {
              backgroundColor: cardBg,
              borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          {/* Timeline dot + line */}
          <View style={styles.timelineCol}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
          </View>

          {/* Icon box */}
          <View
            style={[
              styles.iconBox,
              { backgroundColor: dotColor + (isDark ? '28' : '18') },
            ]}
          >
            <Ionicons
              name={CATEGORY_ICON[payment.category] ?? 'ellipsis-horizontal-outline'}
              size={16}
              color={dotColor}
            />
          </View>

          {/* Body */}
          <View style={styles.rowBody}>
            <AppText variant="labelMD" color={colors.text.primary} numberOfLines={1}>
              {payment.title}
            </AppText>
            <AppText variant="caption" color={colors.text.tertiary}>
              {payment.status === 'SETTLED'
                ? 'Settled'
                : payment.status === 'OVERDUE'
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? 'Due today'
                : `Due in ${days}d`}
              {payment.isRecurring ? '  ·  ↻' : ''}
            </AppText>
          </View>

          {/* Amount */}
          <View style={styles.rowRight}>
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
              <Pressable onPress={handleDelete} hitSlop={10}>
                <Ionicons name="close" size={14} color={colors.text.tertiary} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

// ─── Timeline list ────────────────────────────────────────────────────────────

interface PlannedPaymentsTimelineProps {
  payments:  PlannedPayment[];
  onSettle:  (id: string) => void;
  onDelete:  (id: string) => void;
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
      <AppText variant="headingSM" color={colors.text.primary} style={styles.title}>
        Planned Payments
      </AppText>
      <AppText variant="caption" color={colors.text.tertiary} style={styles.subtitle}>
        Swipe right to settle · Swipe left to reveal actions
      </AppText>

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

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing['2'],
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    fontSize:     11,
    marginBottom: Spacing['3'],
  },
  list: {
    gap: Spacing['2'],
  },
  swipeUnderlay: {
    position:       'absolute',
    left:           0,
    right:          0,
    top:            0,
    bottom:         0,
    borderRadius:   Radius.lg,
    flexDirection:  'row',
    alignItems:     'center',
    paddingLeft:    Spacing['4'],
    gap:            Spacing['2'],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['3'],
    paddingVertical:   Spacing['3'],
    paddingHorizontal: Spacing['3'],
    borderRadius:  Radius.lg,
    borderWidth:   1,
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius:  6,
        shadowColor:   '#000',
      },
      android: { elevation: 1 },
    }),
  },
  timelineCol: {
    alignItems:     'center',
    width:          10,
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  iconBox: {
    width:          34,
    height:         34,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap:  2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap:        4,
  },
  amount: {
    fontSize:   14,
    fontWeight: '700',
  },
});
