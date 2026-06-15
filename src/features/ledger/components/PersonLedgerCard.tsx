import React, { useEffect, useRef } from 'react';
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
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/Dimensions';
import { NudgeButton } from './NudgeButton';
import type { LedgerEntry } from '@store/ledgerStore';

// ─── Avatar ring ─────────────────────────────────────────────────────────────

const RING_SIZE = 52;
const AVATAR_INNER = RING_SIZE - 4;
const RING_THICKNESS = 2;

function AvatarRing({
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
          shadowOpacity: status !== 'SETTLED' ? (isDark ? 0.55 : 0.3) : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: status !== 'SETTLED' ? 4 : 0,
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
            backgroundColor: color + (status === 'SETTLED' ? '28' : '38'),
          },
        ]}
      >
        <AppText
          variant="labelMD"
          style={[styles.initials, { color: status === 'SETTLED' ? colors.text.tertiary : color }]}
        >
          {initials}
        </AppText>
      </View>
    </View>
  );
}

// ─── Status chip ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: LedgerEntry['status'] }) {
  const { colors } = useTheme();
  const chipColor =
    status === 'SETTLED' ? colors.status.income :
      status === 'OVERDUE' ? colors.status.expense :
        colors.status.info;

  const label = status === 'SETTLED' ? 'Settled' : status === 'OVERDUE' ? 'Overdue' : 'Active';

  return (
    <View style={[styles.chip, { backgroundColor: chipColor + '22' }]}>
      <AppText variant="caption" style={{ color: chipColor, fontSize: 10, fontWeight: '700' }}>
        {label}
      </AppText>
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = -80;

interface PersonLedgerCardProps {
  entry: LedgerEntry;
  onPress: (entry: LedgerEntry) => void;
  onSettle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PersonLedgerCard({ entry, onPress, onSettle, onDelete }: PersonLedgerCardProps) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();

  const translateX = useSharedValue(0);
  const rowHeight = useSharedValue(80);
  const opacity = useSharedValue(1);

  // Track whether a meaningful swipe has occurred to suppress the onPress
  const swipedRef = useRef(false);

  const handleSettle = () => onSettle(entry.id);
  const handleDelete = () => onDelete(entry.id);

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-12, 12000])
    .failOffsetY([-10, 10])
    .onBegin(() => { swipedRef.current = false; })
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
        setTimeout(() => { swipedRef.current = false; }, 150);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const remaining = entry.totalAmount - entry.amountReturned;
  const progressPct = entry.totalAmount > 0 ? entry.amountReturned / entry.totalAmount : 0;

  const dirColor =
    entry.direction === 'OWED_TO_ME' ? colors.status.income : colors.status.expense;

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <View style={styles.swipeContainer}>
      {/* Swipe-revealed actions */}
      <View style={styles.actions}>
        {entry.status !== 'SETTLED' && (
          <Pressable
            onPress={handleSettle}
            style={[styles.actionBtn, { backgroundColor: colors.status.income }]}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
        )}
        <Pressable
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: colors.status.expense }]}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.card,
            cardStyle,
            {
              backgroundColor: cardBg,
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              shadowColor: isDark ? '#000' : '#000',
            },
          ]}
        >
          <Pressable
            onPress={() => {
              if (swipedRef.current) {
                translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
                setTimeout(() => { swipedRef.current = false; }, 150);
              } else {
                onPress(entry);
              }
            }}
            style={styles.cardContent}
            android_ripple={{ color: 'rgba(255,255,255,0.05)' }}
          >
            {/* Avatar */}
            <AvatarRing
              initials={entry.personInitials}
              color={entry.personColor}
              status={entry.status}
            />

            {/* Body */}
            <View style={styles.body}>
              <View style={styles.topRow}>
                <View style={styles.nameRow}>
                  <AppText variant="labelLG" color={colors.text.primary} style={styles.name}>
                    {entry.personName}
                  </AppText>
                  <StatusChip status={entry.status} />
                </View>
                <AppText
                  variant="labelLG"
                  style={[styles.amount, { color: dirColor }]}
                >
                  {entry.direction === 'OWED_TO_ME' ? '+' : '-'}{symbol}{remaining.toFixed(2)}
                </AppText>
              </View>

              {entry.note && (
                <AppText variant="caption" color={colors.text.tertiary} numberOfLines={1} style={styles.note}>
                  {entry.note}
                </AppText>
              )}

              {/* Progress bar */}
              {entry.totalAmount > 0 && progressPct > 0 && progressPct < 1 && (
                <View style={[styles.progressTrack, { backgroundColor: colors.glass.backgroundMid }]}>
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
              )}
            </View>

            {/* Right: Nudge + amount total */}
            <View style={styles.right}>
              {entry.status !== 'SETTLED' && <NudgeButton entry={entry} size={30} />}
              <AppText variant="caption" color={colors.text.tertiary} style={styles.total}>
                of {symbol}{entry.totalAmount.toFixed(0)}
              </AppText>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
    marginBottom: Spacing['2'],
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
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
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
    fontSize: 15,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  note: {
    marginTop: 1,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  right: {
    alignItems: 'center',
    gap: 4,
  },
  total: {
    fontSize: 10,
  },
});
