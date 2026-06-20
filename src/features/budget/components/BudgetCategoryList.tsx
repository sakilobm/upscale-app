import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { CategoryIcon } from '@components/CategoryIcon';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/Dimensions';
import type { SpendingStats } from '../hooks/useBudgets';

// ─── Single Grid Card Component ───────────────────────────────────────────────
interface CategoryCardProps {
  item: SpendingStats;
  onDeleteLimit: (id: string) => void;
  onSetLimit: (category: string) => void;
}

function CategoryCard({ item, onDeleteLimit, onSetLimit }: CategoryCardProps) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();

  const pct = item.hasLimit ? item.percent / 100 : 0;
  const isOver = item.hasLimit && item.spent > item.limit;
  const isWarning = item.hasLimit && item.spent >= item.limit * 0.85 && item.spent <= item.limit;
  const remaining = item.hasLimit ? Math.max(item.limit - item.spent, 0) : 0;

  // Status colors based on limit state
  const statusColor = item.hasLimit
    ? (isOver
      ? colors.status.expense
      : isWarning
        ? colors.status.warning
        : colors.status.income)
    : colors.text.secondary;

  // Progress calculations
  const totalProjected = item.spent + item.scheduled;
  const progressPct = item.hasLimit
    ? Math.min(pct, 1)
    : (totalProjected > 0 ? item.spent / totalProjected : 0);

  const progressBarColor = item.hasLimit
    ? statusColor
    : item.color;

  return (
    <Pressable
      onPress={() => {
        if (!item.hasLimit) {
          onSetLimit(item.category);
        }
      }}
      style={({ pressed }) => [
        styles.gridCard,
        {
          backgroundColor: colors.surface.sheet,
          borderColor: item.hasLimit ? statusColor + '40' : colors.glass.border,
          opacity: pressed && !item.hasLimit ? 0.85 : 1,
        },
      ]}
    >
      {/* Top Header Row (Icon + Action Button) */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconHalo, { shadowColor: item.color }]}>
          <CategoryIcon category={item.category} size={30} />
        </View>

        {item.hasLimit ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDeleteLimit(item.budgetId!);
            }}
            style={({ pressed }) => [
              styles.trashBtn,
              {
                backgroundColor: colors.glass.backgroundMid,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={11} color={colors.status.expense} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onSetLimit(item.category)}
            style={({ pressed }) => [
              styles.inlineSetBtn,
              {
                backgroundColor: colors.brand.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="add" size={9} color={colors.brand.onPrimary} />
            <AppText variant="caption" style={[styles.inlineSetBtnText, { color: colors.brand.onPrimary }]}>
              Limit
            </AppText>
          </Pressable>
        )}
      </View>

      {/* Middle Information Stack */}
      <View style={styles.bodyStack}>
        <AppText variant="labelSM" color={colors.text.tertiary} numberOfLines={1} style={styles.nameText}>
          {item.label}
        </AppText>
        <AppText variant="labelLG" color={colors.text.primary} style={styles.spentText}>
          {symbol}{item.spent.toFixed(0)}
          {item.hasLimit && (
            <AppText style={{ fontSize: 10, color: statusColor, fontWeight: '700' }}>
              {' '}({Math.round(item.percent)}%)
            </AppText>
          )}
        </AppText>
      </View>

      {/* Bottom Information Details */}
      <View style={styles.footerRow}>
        {item.hasLimit ? (
          <AppText
            variant="caption"
            numberOfLines={1}
            style={{
              color: isOver ? colors.status.expense : colors.text.secondary,
              fontWeight: '600',
              fontSize: 9.5,
            }}
          >
            {isOver
              ? `${symbol}${(item.spent - item.limit).toFixed(0)} over`
              : `${symbol}${remaining.toFixed(0)} left`}
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.text.tertiary} numberOfLines={1} style={{ fontSize: 9.5 }}>
            {item.scheduled > 0
              ? `Sched: ${symbol}${item.scheduled.toFixed(0)}`
              : 'No bills'}
          </AppText>
        )}
      </View>

      {/* Bottom Glowing Laser Progress Line */}
      {(item.hasLimit || totalProjected > 0) && (
        <View style={[styles.progressTrack, { backgroundColor: colors.glass.backgroundMid }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(progressPct * 100, 100)}%` as any,
                backgroundColor: progressBarColor,
                shadowColor: progressBarColor,
              },
            ]}
          />
        </View>
      )}
    </Pressable>
  );
}

// ─── Single Category Capsule Row Component ───────────────────────────────────
function CategoryCapsule({ item, onDeleteLimit, onSetLimit }: CategoryCardProps) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();

  const pct = item.hasLimit ? item.percent / 100 : 0;
  const isOver = item.hasLimit && item.spent > item.limit;
  const isWarning = item.hasLimit && item.spent >= item.limit * 0.85 && item.spent <= item.limit;
  const remaining = item.hasLimit ? Math.max(item.limit - item.spent, 0) : 0;

  // Status colors based on limit state
  const statusColor = item.hasLimit
    ? (isOver
      ? colors.status.expense
      : isWarning
        ? colors.status.warning
        : colors.status.income)
    : colors.text.secondary;

  // Progress calculations
  const totalProjected = item.spent + item.scheduled;
  const progressPct = item.hasLimit
    ? Math.min(pct, 1)
    : (totalProjected > 0 ? item.spent / totalProjected : 0);

  const fillBg = item.hasLimit
    ? statusColor + '1C'
    : item.color + '1C'; // Use beautiful category color tint instead of muddy grey

  return (
    <Pressable
      onPress={() => {
        if (!item.hasLimit) {
          onSetLimit(item.category);
        }
      }}
      style={({ pressed }) => [
        styles.capsule,
        {
          backgroundColor: colors.surface.sheet, // Solid background prevents shadow show-through
          borderColor: item.hasLimit ? statusColor + '40' : colors.glass.border,
          opacity: pressed && !item.hasLimit ? 0.85 : 1,
        },
      ]}
    >
      {/* 1. Liquid Progress Fill Background */}
      {(item.hasLimit || totalProjected > 0) && (
        <View
          pointerEvents="none"
          style={[
            styles.capsuleProgressFill,
            {
              width: `${Math.min(progressPct * 100, 100)}%` as any,
              backgroundColor: fillBg,
            },
          ]}
        >
          {/* Glowing neon curved end indicator */}
          <View
            style={[
              styles.neonIndicator,
              {
                borderRightColor: item.hasLimit ? statusColor : item.color,
                shadowColor: item.hasLimit ? statusColor : item.color,
              },
            ]}
          />
        </View>
      )}

      {/* 2. Front Content Layer */}
      <View style={styles.contentRow}>
        {/* Category Icon with Halo */}
        <View style={[styles.iconHalo, { shadowColor: item.color }]}>
          <CategoryIcon category={item.category} size={36} />
        </View>

        {/* Text Details Stack */}
        <View style={styles.bodyStackCapsule}>
          <View style={styles.topLabelRow}>
            <AppText variant="labelMD" color={colors.text.primary} style={styles.nameTextCapsule}>
              {item.label}
            </AppText>
            {item.hasLimit && (
              <AppText variant="caption" style={{ color: statusColor, fontSize: 9.5, fontWeight: '700' }}>
                {Math.round(item.percent)}% limit
              </AppText>
            )}
          </View>

          <AppText variant="caption" color={colors.text.secondary} style={styles.subtextCapsule}>
            {item.hasLimit
              ? `${symbol}${item.spent.toFixed(0)} spent of ${symbol}${item.limit.toFixed(0)}`
              : `${symbol}${item.spent.toFixed(0)} spent · ${item.scheduled > 0 ? `${symbol}${item.scheduled.toFixed(0)} scheduled` : 'no bills'}`}
          </AppText>
        </View>

        {/* Right Action / Balance Info */}
        <View style={styles.rightSide}>
          {item.hasLimit ? (
            <View style={styles.limitInfoCol}>
              <AppText
                variant="caption"
                style={{
                  color: isOver ? colors.status.expense : colors.status.income,
                  fontWeight: '700',
                  fontSize: 11,
                }}
              >
                {isOver
                  ? `+${symbol}${(item.spent - item.limit).toFixed(0)}`
                  : `${symbol}${remaining.toFixed(0)} remaining`}
              </AppText>

              <Pressable
                onPress={() => onDeleteLimit(item.budgetId!)}
                style={({ pressed }) => [
                  styles.trashBtn,
                  {
                    backgroundColor: colors.glass.backgroundMid,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="trash-outline" size={12} color={colors.status.expense} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => onSetLimit(item.category)}
              style={({ pressed }) => [
                styles.inlineSetBtn,
                {
                  backgroundColor: colors.brand.primary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={11} color={colors.brand.onPrimary} />
              <AppText variant="caption" style={[styles.inlineSetBtnText, { color: colors.brand.onPrimary }]}>
                Set Limit
              </AppText>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Component Container ────────────────────────────────────────────────
interface BudgetCategoryListProps {
  breakdown: SpendingStats[];
  viewMode: 'grid' | 'capsules';
  onToggleViewMode: () => void;
  onDeleteBudget: (id: string) => void;
  onSetBudgetLimit: (category: string) => void;
}

export function BudgetCategoryList({
  breakdown,
  viewMode,
  onToggleViewMode,
  onDeleteBudget,
  onSetBudgetLimit,
}: BudgetCategoryListProps) {
  const { colors } = useTheme();

  if (!breakdown.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <AppText variant="headingSM" color={colors.text.primary} style={styles.titleText}>
          Category Spent
        </AppText>

        {/* Dynamic, Space-optimized layout toggler */}
        <Pressable
          onPress={onToggleViewMode}
          style={({ pressed }) => [
            styles.hintToggle,
            {
              backgroundColor: colors.glass.background,
              borderColor: colors.glass.border,
              opacity: pressed ? 0.75 : 1,
            }
          ]}
        >
          <Ionicons
            name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
            size={12}
            color={colors.brand.primary}
          />
          <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 9.5 }}>
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </AppText>
        </Pressable>
      </View>

      {/* Render selected viewMode */}
      {viewMode === 'grid' ? (
        <View style={styles.gridStack}>
          {breakdown.map((item) => (
            <CategoryCard
              key={item.category}
              item={item}
              onDeleteLimit={onDeleteBudget}
              onSetLimit={onSetBudgetLimit}
            />
          ))}
        </View>
      ) : (
        <View style={styles.listStack}>
          {breakdown.map((item) => (
            <CategoryCapsule
              key={item.category}
              item={item}
              onDeleteLimit={onDeleteBudget}
              onSetLimit={onSetBudgetLimit}
            />
          ))}
        </View>
      )}
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
    marginBottom: 2,
    gap: 8,
  },
  titleText: {
    flexShrink: 1,
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  gridStack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  listStack: {
    gap: 10,
  },
  gridCard: {
    width: '48.5%',
    height: 106,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.04)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconHalo: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bodyStack: {
    gap: 1.5,
    marginTop: 4,
  },
  nameText: {
    fontWeight: '700',
    fontSize: 10.5,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  spentText: {
    fontWeight: '800',
    fontSize: 15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
  },
  progressFill: {
    height: '100%',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
      },
    }),
  },
  trashBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.12)',
  },
  inlineSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1.5,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  inlineSetBtnText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Capsule Styles
  capsule: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.04)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  capsuleProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    overflow: 'hidden', // Clips the children to the rounded right-side curve
  },
  neonIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3.5,
    borderColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingLeft: 14,
    paddingRight: Spacing['4'],
    zIndex: 1,
  },
  bodyStackCapsule: {
    flex: 1,
    marginLeft: Spacing['3'],
    justifyContent: 'center',
    gap: 1.5,
  },
  nameTextCapsule: {
    fontWeight: '700',
    fontSize: 13.5,
  },
  subtextCapsule: {
    fontSize: 10.5,
  },
  rightSide: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%',
  },
  limitInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
});
