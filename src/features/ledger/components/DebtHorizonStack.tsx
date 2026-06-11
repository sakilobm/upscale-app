import { useState, useRef } from 'react';
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

function LoanCard({
  loan,
  onRecord,
}: {
  loan:     Loan;
  onRecord: (id: string) => void;
}) {
  const { isDark } = useTheme();

  const progress  = loanProgress(loan);
  const days      = daysUntilPayment(loan);
  const isUrgent  = days >= 0 && days <= 7;
  const isLate    = days < 0;
  const remaining = loan.principalAmount - loan.amountPaid;

  const gradient: [string, string] = isDark
    ? [loan.color + 'D0', loan.color + '90']
    : [loan.color + 'F5', loan.color + 'B0'];

  const dueBg = isLate
    ? 'rgba(239,68,68,0.30)'
    : isUrgent
    ? 'rgba(245,158,11,0.30)'
    : 'rgba(0,0,0,0.20)';

  const dueColor = isLate ? '#FCA5A5' : 'rgba(255,255,255,0.85)';
  const dueIcon  = isLate ? 'alert-circle' as const : 'calendar-outline' as const;
  const dueText  = isLate
    ? `${Math.abs(days)}d overdue`
    : days === 0
    ? 'Due today'
    : `Due in ${days}d`;

  return (
    /* Shadow wrapper — separate from overflow:hidden so iOS shadow renders */
    <View style={[styles.cardShadow, { shadowColor: loan.color }]}>
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
              <AppText style={styles.typeLabel}>
                {loan.type === 'BORROWED' ? '↓ BORROWED' : '↑ LENT OUT'}
              </AppText>
              <AppText style={styles.loanName}>{loan.name}</AppText>
              <AppText style={styles.counterparty}>{loan.counterparty}</AppText>
            </View>
            <View style={styles.emiBadge}>
              <AppText style={styles.emiLabel}>EMI</AppText>
              <AppText style={styles.emiAmount}>
                ${loan.emiAmount.toLocaleString()}
              </AppText>
            </View>
          </View>

          {/* Balance */}
          <AppText style={styles.balance}>
            ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </AppText>
          <AppText style={styles.balanceSub}>
            remaining of ${loan.principalAmount.toLocaleString()}
          </AppText>

          {/* Progress */}
          <View style={styles.progressRow}>
            <ProgressBar
              progress={progress}
              gradient={['rgba(255,255,255,0.90)', 'rgba(255,255,255,0.55)']}
              height={4}
              style={{ flex: 1 }}
              trackColor="rgba(255,255,255,0.20)"
            />
            <AppText style={styles.progressLabel}>
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
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRecord(loan.id);
              }}
              style={styles.markPaidBtn}
            >
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              <AppText style={styles.markPaidText}>Mark Paid</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

interface DebtHorizonStackProps {
  loans:           Loan[];
  onRecordPayment: (loanId: string) => void;
}

export function DebtHorizonStack({ loans, onRecordPayment }: DebtHorizonStackProps) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (!loans.length) return null;

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SNAP_INTERVAL, animated: true });
    setActiveIndex(idx);
    Haptics.selectionAsync();
  };

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
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(
            e.nativeEvent.contentOffset.x / SNAP_INTERVAL
          );
          setActiveIndex(Math.max(0, Math.min(idx, loans.length - 1)));
        }}
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
            <LoanCard loan={loan} onRecord={onRecordPayment} />
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
}

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
    color:         'rgba(255,255,255,0.70)',
    letterSpacing: 1,
    fontWeight:    '700',
    marginBottom:  2,
  },
  loanName: {
    fontSize:   16,
    fontWeight: '800',
    color:      '#FFFFFF',
  },
  counterparty: {
    fontSize: 12,
    color:    'rgba(255,255,255,0.62)',
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
    color:         'rgba(255,255,255,0.60)',
    letterSpacing: 0.5,
  },
  emiAmount: {
    fontSize:   14,
    fontWeight: '700',
    color:      '#FFFFFF',
  },

  // Balance
  balance: {
    fontSize:   22,
    fontWeight: '800',
    color:      '#FFFFFF',
    lineHeight: 26,
  },
  balanceSub: {
    fontSize:     11,
    color:        'rgba(255,255,255,0.58)',
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
    color:     'rgba(255,255,255,0.62)',
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
    color:      '#FFFFFF',
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
