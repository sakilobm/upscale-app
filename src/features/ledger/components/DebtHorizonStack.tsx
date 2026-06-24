import React, { useState, useRef, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/Dimensions';
import { loanProgress, daysUntilPayment } from '@store/loansStore';
import type { Loan } from '@store/loansStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PARENT_PAD   = 20;                          // parent scroll paddingHorizontal
const CARD_WIDTH   = SCREEN_WIDTH - PARENT_PAD * 2; // fills content area exactly
const CARD_GAP     = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const CARD_HEIGHT  = 182;

// ─── Single card ──────────────────────────────────────────────────────────────

const LoanCard = memo(function LoanCard({
  loan,
  onRecord,
  onPress,
}: {
  loan:     Loan;
  onRecord: (id: string) => void;
  onPress:  (loan: Loan) => void;
}) {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();

  const progress  = loanProgress(loan);
  const days      = daysUntilPayment(loan);
  const isUrgent  = days >= 0 && days <= 7;
  const isLate    = days < 0;
  const remaining = loan.principalAmount - loan.amountPaid;

  const gradient: [string, string] = isDark
    ? [loan.color + 'D0', loan.color + '90']
    : [loan.color + 'F5', loan.color + 'B0'];

  const dueBg = isLate
    ? colors.status.expense + '4D'
    : isUrgent
    ? colors.status.warning + '4D'
    : colors.black + '33';

  const dueColor = isLate ? colors.text.negative : colors.white + 'D9';
  const dueIcon  = isLate ? 'alert-circle' as const : 'calendar-outline' as const;
  const dueText  = isLate
    ? `${Math.abs(days)}d overdue`
    : days === 0
    ? 'Due today'
    : `Due in ${days}d`;

  const handleRecord = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onRecord(loan.id);
  }, [loan.id, onRecord]);

  const handlePress = useCallback(() => {
    onPress(loan);
  }, [loan, onPress]);

  return (
    /* Shadow wrapper — separate from overflow:hidden so iOS shadow renders */
    <Pressable
      onPress={handlePress}
      style={[styles.cardShadow, { shadowColor: loan.color }]}
    >
      {/* Clip container — clips LinearGradient + glowBlob to rounded corners */}
      <View style={styles.cardClip}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.glowBlob, { backgroundColor: loan.color + '20' }]} />

        <View style={styles.cardInner}>
          {/* Header */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.typeLabel, { color: colors.white + 'B3' }]}>
                {loan.type === 'BORROWED' ? '↓ BORROWED' : '↑ LENT OUT'}
              </AppText>
              <AppText style={[styles.loanName, { color: colors.white }]}>{loan.name}</AppText>
              <AppText style={[styles.counterparty, { color: colors.white + '9E' }]}>{loan.counterparty}</AppText>
            </View>
            <View style={styles.emiBadge}>
              <AppText style={[styles.emiLabel, { color: colors.white + '99' }]}>EMI</AppText>
              <AppText style={[styles.emiAmount, { color: colors.white }]}>
                {symbol}{loan.emiAmount.toLocaleString()}
              </AppText>
            </View>
          </View>

          {/* Balance */}
          <AppText style={[styles.balance, { color: colors.white }]}>
            {symbol}{remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </AppText>
          <AppText style={[styles.balanceSub, { color: colors.white + '94' }]}>
            remaining of {symbol}{loan.principalAmount.toLocaleString()}
          </AppText>

          {/* Progress */}
          <View style={styles.progressRow}>
            <ProgressBar
              progress={progress}
              gradient={[colors.white + 'E6', colors.white + '8C']}
              height={4}
              style={{ flex: 1 }}
              trackColor={colors.white + '33'}
            />
            <AppText style={[styles.progressLabel, { color: colors.white + '9E' }]}>
              {loan.completedPayments}/{loan.totalPayments} paid
            </AppText>
          </View>

          {/* Footer */}
          <View style={styles.row}>
            <View style={[styles.dueBadge, { backgroundColor: dueBg }]}>
              <Ionicons name={dueIcon} size={12} color={dueColor} />
              <AppText style={[styles.dueText, { color: dueColor }]}>{dueText}</AppText>
            </View>
            <Pressable
              onPress={handleRecord}
              style={styles.markPaidBtn}
            >
              <Ionicons name="checkmark" size={13} color={colors.white} />
              <AppText style={[styles.markPaidText, { color: colors.white }]}>Mark Paid</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
});

// ─── Carousel ─────────────────────────────────────────────────────────────────

interface DebtHorizonStackProps {
  loans:           Loan[];
  onRecordPayment: (loanId: string) => void;
  onPressCard:     (loan: Loan) => void;
}

export const DebtHorizonStack = memo(function DebtHorizonStack({
  loans,
  onRecordPayment,
  onPressCard,
}: DebtHorizonStackProps) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SNAP_INTERVAL, animated: true });
    setActiveIndex(idx);
    Haptics.selectionAsync().catch(() => {});
  }, []);

  const handleScrollEnd = useCallback((e: any) => {
    const idx = Math.round(
      e.nativeEvent.contentOffset.x / SNAP_INTERVAL
    );
    setActiveIndex(Math.max(0, Math.min(idx, loans.length - 1)));
  }, [loans.length]);

  if (!loans.length) return null;

  return (
    /* Negative margin breaks out of parent's 20px horizontal padding */
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={16}
        nestedScrollEnabled
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {loans.map((loan, idx) => (
          <View
            key={loan.id}
            style={[
              styles.cardPage,
              idx < loans.length - 1 && { marginRight: CARD_GAP },
            ]}
          >
            <LoanCard loan={loan} onRecord={onRecordPayment} onPress={onPressCard} />
          </View>
        ))}
      </ScrollView>

      {/* Dots — re-indented into normal content flow */}
      {loans.length > 1 && (
        <View style={styles.dots}>
          {loans.map((_, idx) => (
            <Pressable key={idx} onPress={() => goTo(idx)} hitSlop={12}>
              <View
                style={[
                  styles.dot,
                  {
                    width: idx === activeIndex ? 20 : 6,
                    backgroundColor:
                      idx === activeIndex
                        ? colors.text.primary
                        : colors.text.tertiary + '80',
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}

      <AppText
        variant="caption"
        color={colors.text.tertiary}
        align="center"
        style={styles.hint}
      >
        {activeIndex + 1} of {loans.length} · swipe to browse
      </AppText>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    marginHorizontal: -PARENT_PAD, // break out of parent's horizontal padding
  },
  carousel: {
    // width is unconstrained — stretches to SCREEN_WIDTH naturally
  },
  carouselContent: {
    paddingHorizontal: PARENT_PAD,
  },
  cardPage: {
    width: CARD_WIDTH,
  },

  // Shadow wrapper — no overflow:hidden so shadow renders on iOS
  cardShadow: {
    width:  CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.xl,
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius:  18,
      },
      android: { elevation: 10 },
    }),
  },
  // Clip container — has overflow:hidden + borderRadius to clip gradient & blob
  cardClip: {
    width:        CARD_WIDTH,
    height:       CARD_HEIGHT,
    borderRadius: Radius.xl,
    overflow:     'hidden',
  },
  glowBlob: {
    position:     'absolute',
    right:        -40,
    top:          -40,
    width:        160,
    height:       160,
    borderRadius: 80,
  },
  cardInner: {
    flex:    1,
    padding: Spacing['4'],
    gap:     Spacing['2'],
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },

  // Header text
  typeLabel: {
    fontSize:      10,
    letterSpacing: 1,
    fontWeight:    '700',
    marginBottom:  2,
  },
  loanName: {
    fontSize:   16,
    fontWeight: '800',
  },
  counterparty: {
    fontSize: 12,
  },

  // EMI badge
  emiBadge: {
    alignItems:        'center',
    backgroundColor:   'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      Radius.md,
  },
  emiLabel: {
    fontSize:      10,
    letterSpacing: 0.5,
  },
  emiAmount: {
    fontSize:   14,
    fontWeight: '700',
  },

  // Balance
  balance: {
    fontSize:   22,
    fontWeight: '800',
    lineHeight: 26,
  },
  balanceSub: {
    fontSize:     11,
    marginBottom: 2,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  progressLabel: {
    fontSize:  10,
    flexShrink: 0,
  },

  // Footer
  dueBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      Radius.full,
  },
  dueText: {
    fontSize: 11,
  },
  markPaidBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    marginLeft:        'auto',
    backgroundColor:   'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:      Radius.full,
  },
  markPaidText: {
    fontSize:   12,
    fontWeight: '700',
  },

  // Dots
  dots: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    marginTop:       Spacing['4'],
    paddingHorizontal: PARENT_PAD,
  },
  dot: {
    height:       6,
    borderRadius: 3,
  },
  hint: {
    marginTop:         Spacing['2'],
    fontSize:          11,
    opacity:           0.55,
    paddingHorizontal: PARENT_PAD,
  },
});
