import React, { useRef, useCallback, memo, useMemo } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { Radius, Spacing } from '@constants/Dimensions';
import { NudgeButton } from './NudgeButton';
import type { LedgerEntry } from '@store/ledgerStore';

// ─── Avatar ──────────────────────────────────────────────────────────────────

const RING_SIZE = 44;
const AVATAR_INNER = RING_SIZE - 4;
const RING_THICKNESS = 2;

const AvatarRing = memo(function AvatarRing({
  initials,
  color,
  status,
}: {
  initials: string;
  color: string;
  status: LedgerEntry['status'];
}) {
  const { colors, isDark } = useTheme();
  const ringColor =
    status === 'SETTLED' ? colors.text.tertiary :
      status === 'OVERDUE' ? colors.status.expense :
        color;

  return (
    <View
      style={[
        styles.avatarRing,
        {
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: RING_SIZE / 2,
          borderColor: ringColor,
          borderWidth: RING_THICKNESS,
          shadowColor: ringColor,
          shadowOpacity: status !== 'SETTLED' ? (isDark ? 0.35 : 0.15) : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: status !== 'SETTLED' ? 3 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.avatarInner,
          {
            width: AVATAR_INNER,
            height: AVATAR_INNER,
            borderRadius: AVATAR_INNER / 2,
            backgroundColor: color + (status === 'SETTLED' ? '15' : '22'),
          },
        ]}
      >
        <AppText
          variant="labelMD"
          style={[
            styles.initials,
            { color: status === 'SETTLED' ? colors.text.tertiary : color },
          ]}
        >
          {initials}
        </AppText>
      </View>
    </View>
  );
});

// ─── Status chip ─────────────────────────────────────────────────────────────

const StatusChip = memo(function StatusChip({ status }: { status: LedgerEntry['status'] }) {
  const { colors } = useTheme();
  const chipColor =
    status === 'SETTLED' ? colors.status.income :
      status === 'OVERDUE' ? colors.status.expense :
        colors.status.info;

  const label = status === 'SETTLED' ? 'Settled' : status === 'OVERDUE' ? 'Overdue' : 'Active';

  return (
    <View style={[styles.chip, { backgroundColor: chipColor + '12', borderColor: chipColor + '22' }]}>
      <View style={[styles.chipDot, { backgroundColor: chipColor }]} />
      <AppText variant="caption" style={[styles.chipText, { color: chipColor }]}>
        {label}
      </AppText>
    </View>
  );
});

// ─── Card ────────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = -80;

interface PersonLedgerCardProps {
  entry: LedgerEntry;
  onPress: (entry: LedgerEntry) => void;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const PersonLedgerCard = memo(function PersonLedgerCard({
  entry,
  onPress,
  onSettle,
  onDelete,
}: PersonLedgerCardProps) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const account = useAccountStore((s) => s.accounts.find((a) => a.id === entry.accountId));

  const translateX = useSharedValue(0);
  const swipedRef = useRef(false);

  const handleSettle = useCallback(() => onSettle(entry.id), [entry.id, onSettle]);
  const handleDelete = useCallback(() => onDelete(entry.id), [entry.id, onDelete]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .runOnJS(true)
      .activeOffsetX([-12, 12000])
      .failOffsetY([-10, 10])
      .onBegin(() => {
        swipedRef.current = false;
      })
      .onUpdate((e) => {
        if (e.translationX < -6) swipedRef.current = true;
        if (e.translationX < 0) {
          translateX.value = Math.max(e.translationX, -140);
        } else {
          translateX.value = Math.min(e.translationX * 0.15, 5);
        }
      })
      .onEnd((e) => {
        if (e.translationX < SWIPE_THRESHOLD) {
          translateX.value = withSpring(-120, { damping: 20, stiffness: 180 });
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
          setTimeout(() => {
            swipedRef.current = false;
          }, 150);
        }
      });
  }, [translateX]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const remaining = entry.totalAmount - entry.amountReturned;
  const progressPct = entry.totalAmount > 0 ? entry.amountReturned / entry.totalAmount : 0;

  const dirColor =
    entry.direction === 'OWED_TO_ME' ? colors.status.income : colors.status.expense;

  const ringColor =
    entry.status === 'SETTLED' ? colors.text.tertiary :
      entry.status === 'OVERDUE' ? colors.status.expense :
        entry.personColor;

  const glowColor =
    entry.status === 'SETTLED' ? colors.transparent : ringColor;

  // Modern glow border: dynamic glow color at low opacity, or fallback to glass border
  const cardBorderColor = entry.status !== 'SETTLED'
    ? glowColor + (isDark ? '44' : '26') // Translucent border glow matching person/status
    : (isDark ? colors.glass.border : colors.glass.borderStrong);

  const cardGradColors = isDark
    ? [colors.background.secondary, colors.background.tertiary] as const
    : ['#FFFFFF', '#F8FAFC'] as const;

  const handlePressCard = useCallback(() => {
    if (swipedRef.current) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
      setTimeout(() => {
        swipedRef.current = false;
      }, 150);
    } else {
      onPress(entry);
    }
  }, [entry, onPress, translateX]);

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe-revealed actions */}
      <View style={styles.actions}>
        {entry.status !== 'SETTLED' && (
          <Pressable
            onPress={handleSettle}
            style={[styles.actionBtn, { backgroundColor: colors.status.income }]}
          >
            <Ionicons name="checkmark" size={20} color={colors.white} />
          </Pressable>
        )}
        <Pressable
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: colors.status.expense }]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.white} />
        </Pressable>
      </View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              shadowColor: glowColor,
              shadowOpacity: entry.status !== 'SETTLED' ? (isDark ? 0.35 : 0.1) : 0,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 6 },
              backgroundColor: isDark ? colors.background.secondary : colors.white,
            },
          ]}
        >
          {/* Inner clips container for child elements to allow overflow shadows */}
          <View style={[styles.cardInner, { borderColor: cardBorderColor }]}>
            {/* Custom Linear Gradient for polished visual depth */}
            <LinearGradient
              colors={cardGradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Ambient glow blob matching the status or person color */}
            {entry.status !== 'SETTLED' && (
              <View
                style={[
                  styles.cardGlowBlob,
                  {
                    backgroundColor: glowColor,
                    opacity: isDark ? 0.08 : 0.04,
                  },
                ]}
              />
            )}

            {/* Top shine overlay to give glassmorphic texture in dark mode */}
            {isDark && (
              <View style={[styles.cardShine, { backgroundColor: colors.glass.shine }]} />
            )}

            <Pressable
              onPress={handlePressCard}
              style={styles.cardContent}
              android_ripple={{ color: colors.glass.backgroundMid }}
            >
              {/* Row 1: Avatar + Name + Amount */}
              <View style={styles.mainRow}>
                <AvatarRing
                  initials={entry.personInitials}
                  color={entry.personColor}
                  status={entry.status}
                />

                <View style={styles.nameBlock}>
                  <AppText
                    variant="labelLG"
                    color={colors.text.primary}
                    numberOfLines={1}
                    style={styles.name}
                  >
                    {entry.personName}
                  </AppText>

                  {/* Meta line: account badge + note */}
                  <View style={styles.metaRow}>
                    {account && (
                      <View
                        style={[
                          styles.accountBadge,
                          {
                            backgroundColor: isDark ? account.color + '15' : account.color + '0E',
                            borderColor: isDark ? account.color + '2C' : account.color + '18',
                          },
                        ]}
                      >
                        <Ionicons name={account.icon as any} size={9} color={account.color} />
                        <AppText style={[styles.accountLabel, { color: account.color }]}>
                          {account.name}
                        </AppText>
                      </View>
                    )}
                    {entry.note && (
                      <AppText
                        variant="caption"
                        color={colors.text.secondary}
                        numberOfLines={1}
                        style={styles.note}
                      >
                        {entry.note}
                      </AppText>
                    )}
                  </View>
                </View>

                {/* Right: Amount + Status */}
                <View style={styles.amountBlock}>
                  <AppText
                    style={[styles.amount, { color: dirColor }]}
                    numberOfLines={1}
                  >
                    {entry.direction === 'OWED_TO_ME' ? '+' : '-'}{symbol}{remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </AppText>
                  <View style={styles.amountMeta}>
                    <StatusChip status={entry.status} />
                    {entry.status !== 'SETTLED' && <NudgeButton entry={entry} size={28} />}
                  </View>
                </View>
              </View>

              {/* Row 2: Progress bar (only when partial returns exist) */}
              {entry.totalAmount > 0 && progressPct > 0 && progressPct < 1 && (
                <View style={styles.progressSection}>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${progressPct * 100}%` as any,
                          backgroundColor: entry.personColor,
                        },
                      ]}
                    />
                  </View>
                  <AppText variant="caption" color={colors.text.secondary} style={styles.progressLabel}>
                    {symbol}{entry.amountReturned.toLocaleString(undefined, { maximumFractionDigits: 0 })} returned of {symbol}{entry.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </AppText>
                </View>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacing['3'],
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  cardInner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  cardGlowBlob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cardContent: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    gap: Spacing['3'],
  },

  /* Row 1: main content */
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  avatarRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  nameBlock: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  accountLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  note: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '400',
  },

  /* Right: amount + status */
  amountBlock: {
    alignItems: 'flex-end',
    gap: 5,
  },
  amount: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  amountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  /* Status chip */
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  /* Progress section */
  progressSection: {
    gap: 5,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2.5,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'right',
  },
});
