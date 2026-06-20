import React, { useRef } from 'react';
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
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { GlassCard } from '@components/GlassCard';
import { CategoryIcon } from '@components/CategoryIcon';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/Dimensions';
import type { Budget } from '@store/types';

// ─── Constants ────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = -50;
const DELETE_ZONE_WIDTH = 68;

// ─── Single Category Row ──────────────────────────────────────────────────────
interface CategoryRowProps {
  budget: Budget;
  onDelete: (id: string) => void;
  onPress?: (budget: Budget) => void;
}

function CategoryRow({ budget, onDelete, onPress }: CategoryRowProps) {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();

  const translateX = useSharedValue(0);
  const swipedRef = useRef(false);

  const pct = budget.limit > 0 ? budget.spent / budget.limit : 0;
  const isOver = pct > 1;
  const isWarning = pct >= 0.85 && pct <= 1;
  const remaining = Math.max(budget.limit - budget.spent, 0);

  const statusColor = isOver
    ? colors.status.expense
    : isWarning
      ? colors.status.warning
      : colors.status.income;

  const statusBg = statusColor + '18';

  const handleDelete = () => {
    onDelete(budget.id);
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12000])
    .failOffsetY([-10, 10])
    .onBegin(() => {
      swipedRef.current = false;
    })
    .onUpdate((e) => {
      if (e.translationX < -6) swipedRef.current = true;
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -(DELETE_ZONE_WIDTH + 12));
      } else {
        translateX.value = Math.min(e.translationX * 0.15, 5);
      }
    })
    .onEnd((e) => {
      if (e.translationX < SWIPE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_ZONE_WIDTH, { damping: 20, stiffness: 180 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
        setTimeout(() => {
          swipedRef.current = false;
        }, 150);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const label = budget.category.charAt(0).toUpperCase() + budget.category.slice(1);

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe actions (revealed on swipe left) */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: colors.status.expense }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.white} />
        </Pressable>
      </View>

      {/* Main Budget Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              backgroundColor: colors.surface.sheet,
              borderColor: colors.glass.background,
              shadowColor: colors.black,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (swipedRef.current) {
                translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
                setTimeout(() => {
                  swipedRef.current = false;
                }, 150);
              } else {
                onPress?.(budget);
              }
            }}
            style={styles.cardContent}
            android_ripple={{ color: colors.glass.backgroundMid }}
          >
            {/* Category Icon */}
            <CategoryIcon category={budget.category} size={42} />

            {/* Content Body */}
            <View style={styles.body}>
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  <AppText variant="labelMD" color={colors.text.primary} style={styles.name}>
                    {label}
                  </AppText>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <AppText
                      variant="caption"
                      style={{ color: statusColor, fontSize: 9, fontWeight: '700' }}
                    >
                      {isOver
                        ? 'Exceeded'
                        : isWarning
                          ? 'Warning'
                          : `${Math.round(pct * 100)}% Spent`}
                    </AppText>
                  </View>
                </View>
                <AppText variant="labelMD" color={colors.text.primary} style={styles.spentText}>
                  {symbol}{budget.spent.toFixed(0)}
                  <AppText variant="caption" color={colors.text.tertiary}>
                    {' '}of {symbol}{budget.limit.toFixed(0)}
                  </AppText>
                </AppText>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressTrack, { backgroundColor: colors.glass.backgroundMid }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(pct * 100, 100)}%` as any,
                      backgroundColor: statusColor,
                    },
                  ]}
                />
              </View>

              {/* Bottom Row info */}
              <View style={styles.bottomRow}>
                <AppText variant="caption" color={colors.text.tertiary}>
                  Monthly Budget Limit
                </AppText>
                <AppText
                  variant="caption"
                  style={{
                    color: isOver ? colors.status.expense : colors.text.secondary,
                    fontWeight: '600',
                  }}
                >
                  {isOver
                    ? `${symbol}${(budget.spent - budget.limit).toFixed(0)} over limit`
                    : `${symbol}${remaining.toFixed(0)} remaining`}
                </AppText>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Category List ────────────────────────────────────────────────────────────
interface BudgetCategoryListProps {
  budgets: Budget[];
  onDeleteBudget: (id: string) => void;
  onPressBudget?: (budget: Budget) => void;
}

export function BudgetCategoryList({ budgets, onDeleteBudget, onPressBudget }: BudgetCategoryListProps) {
  const { colors } = useTheme();

  if (!budgets.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText variant="headingSM" color={colors.text.primary}>
          Category Budgets
        </AppText>
        <View style={[styles.hint, { backgroundColor: colors.glass.background, borderColor: colors.glass.border }]}>
          <Ionicons name="arrow-back-outline" size={10} color={colors.text.tertiary} />
          <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '500', fontSize: 9 }}>
            Swipe left to remove limit
          </AppText>
        </View>
      </View>

      <View style={styles.list}>
        {budgets.map((b) => (
          <CategoryRow
            key={b.id}
            budget={b}
            onDelete={onDeleteBudget}
            onPress={onPressBudget}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  list: {
    gap: Spacing['2'],
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacing['1'],
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    zIndex: 0,
  },
  actionBtn: {
    width: DELETE_ZONE_WIDTH - 12,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    gap: Spacing['3'],
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  spentText: {
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
