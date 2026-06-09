import React, { useState } from 'react';
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing } from '@constants/Dimensions';
import { loanProgress, daysUntilPayment } from '@store/loansStore';
import type { Loan } from '@store/loansStore';

const CARD_WIDTH   = Dimensions.get('window').width - 40;
const CARD_HEIGHT  = 160;
const STACK_OFFSET = 10;

// ─── Single loan card ─────────────────────────────────────────────────────────

interface LoanCardProps {
  loan:       Loan;
  stackIndex: number;
  total:      number;
  isActive:   boolean;
  onPress:    () => void;
  onRecord:   (id: string) => void;
}

function LoanCard({ loan, stackIndex, total, isActive, onPress, onRecord }: LoanCardProps) {
  const { colors, isDark } = useTheme();
  const progress = loanProgress(loan);
  const days     = daysUntilPayment(loan);
  const isUrgent = days >= 0 && days <= 7;
  const isLate   = days < 0;

  const cardGradient: [string, string] = isDark
    ? [loan.color + 'CC', loan.color + '88']
    : [loan.color + 'EE', loan.color + 'AA'];

  const translateY = useSharedValue(isActive ? 0 : stackIndex * -STACK_OFFSET);
  const scale      = useSharedValue(isActive ? 1 : 1 - stackIndex * 0.025);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale:      scale.value },
    ],
  }));

  const remaining  = loan.principalAmount - loan.amountPaid;
  const emiPercent = (loan.completedPayments / Math.max(loan.totalPayments, 1)) * 100;

  return (
    <Animated.View
      style={[
        styles.card,
        animStyle,
        {
          zIndex:       total - stackIndex,
          top:          stackIndex * STACK_OFFSET,
          marginBottom: stackIndex === 0 ? 0 : -STACK_OFFSET * 2.5,
        },
      ]}
    >
      <Pressable onPress={onPress} style={styles.cardInner}>
        <LinearGradient
          colors={cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
        />

        {/* Glow decoration */}
        <View
          style={[
            styles.glow,
            { backgroundColor: loan.color + '20' },
          ]}
        />

        {/* Header row */}
        <View style={styles.header}>
          <View>
            <AppText variant="labelSM" style={styles.cardType}>
              {loan.type === 'BORROWED' ? '↓ BORROWED' : '↑ LENT OUT'}
            </AppText>
            <AppText variant="headingSM" style={styles.cardName}>
              {loan.name}
            </AppText>
            <AppText variant="caption" style={styles.cardCounterparty}>
              {loan.counterparty}
            </AppText>
          </View>

          {/* EMI badge */}
          <View style={[styles.emiBadge, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
            <AppText variant="caption" style={styles.emiLabel}>EMI</AppText>
            <AppText variant="labelMD" style={styles.emiAmount}>
              ${loan.emiAmount.toLocaleString()}
            </AppText>
          </View>
        </View>

        {/* Balance row */}
        <AppText variant="numericLG" style={styles.balance}>
          ${remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </AppText>
        <AppText variant="caption" style={styles.balanceLabel}>
          remaining of ${loan.principalAmount.toLocaleString()}
        </AppText>

        {/* Progress */}
        <View style={styles.progressRow}>
          <ProgressBar
            progress={progress}
            gradient={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.6)']}
            height={4}
            style={styles.progressBar}
            trackColor="rgba(255,255,255,0.2)"
          />
          <AppText variant="caption" style={styles.progressLabel}>
            {loan.completedPayments}/{loan.totalPayments} paid
          </AppText>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={[
            styles.dueBadge,
            {
              backgroundColor: isLate
                ? 'rgba(239,68,68,0.3)'
                : isUrgent
                ? 'rgba(245,158,11,0.3)'
                : 'rgba(0,0,0,0.2)',
            },
          ]}>
            <Ionicons
              name={isLate ? 'alert-circle' : 'calendar-outline'}
              size={12}
              color={isLate ? '#FCA5A5' : isUrgent ? '#FCD34D' : 'rgba(255,255,255,0.8)'}
            />
            <AppText variant="caption" style={[styles.dueText, { color: isLate ? '#FCA5A5' : 'rgba(255,255,255,0.85)' }]}>
              {isLate
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? 'Due today'
                : `Due in ${days}d`}
            </AppText>
          </View>

          {isActive && (
            <Pressable
              onPress={() => onRecord(loan.id)}
              style={styles.recordBtn}
            >
              <AppText variant="labelSM" style={styles.recordBtnText}>
                Mark Paid
              </AppText>
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Stack ────────────────────────────────────────────────────────────────────

interface DebtHorizonStackProps {
  loans:        Loan[];
  onRecordPayment: (loanId: string) => void;
}

export function DebtHorizonStack({ loans, onRecordPayment }: DebtHorizonStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { colors } = useTheme();

  if (!loans.length) return null;

  const visible = loans.slice(0, Math.min(loans.length, 3));

  return (
    <View>
      <View style={[styles.stackContainer, { height: CARD_HEIGHT + (visible.length - 1) * STACK_OFFSET + 20 }]}>
        {visible.map((loan, idx) => (
          <LoanCard
            key={loan.id}
            loan={loan}
            stackIndex={idx}
            total={visible.length}
            isActive={idx === activeIndex}
            onPress={() => setActiveIndex(idx === activeIndex ? 0 : idx)}
            onRecord={onRecordPayment}
          />
        ))}
      </View>

      {/* Dot navigator */}
      {loans.length > 1 && (
        <View style={styles.dots}>
          {visible.map((_, idx) => (
            <Pressable key={idx} onPress={() => setActiveIndex(idx)}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === activeIndex
                      ? colors.text.primary
                      : colors.text.tertiary,
                    width: idx === activeIndex ? 16 : 6,
                  },
                ]}
              />
            </Pressable>
          ))}
          {loans.length > 3 && (
            <AppText variant="caption" color={colors.text.tertiary}>
              +{loans.length - 3} more
            </AppText>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stackContainer: {
    position: 'relative',
    width:    CARD_WIDTH,
  },
  card: {
    position:     'absolute',
    width:        CARD_WIDTH,
    height:       CARD_HEIGHT,
    borderRadius: Radius.xl,
    overflow:     'hidden',
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.30,
        shadowRadius:  14,
        shadowColor:   '#000',
      },
      android: { elevation: 8 },
    }),
  },
  cardInner: {
    flex:    1,
    padding: Spacing['4'],
  },
  glow: {
    position:     'absolute',
    right:        -40,
    top:          -40,
    width:        160,
    height:       160,
    borderRadius: 80,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   Spacing['2'],
  },
  cardType: {
    fontSize:      10,
    color:         'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    fontWeight:    '700',
    marginBottom:  2,
  },
  cardName: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '700',
  },
  cardCounterparty: {
    color:   'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  emiBadge: {
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      Radius.md,
    alignItems:        'center',
  },
  emiLabel: {
    color:         'rgba(255,255,255,0.6)',
    fontSize:      10,
    letterSpacing: 0.5,
  },
  emiAmount: {
    color:      '#FFFFFF',
    fontWeight: '700',
    fontSize:   14,
  },
  balance: {
    color:      '#FFFFFF',
    fontSize:   22,
    fontWeight: '800',
    lineHeight: 26,
  },
  balanceLabel: {
    color:       'rgba(255,255,255,0.6)',
    fontSize:    11,
    marginBottom: Spacing['2'],
  },
  progressRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['2'],
    marginBottom:   Spacing['3'],
  },
  progressBar: {
    flex: 1,
  },
  progressLabel: {
    color:    'rgba(255,255,255,0.65)',
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  dueBadge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:   999,
  },
  dueText: {
    fontSize: 11,
  },
  recordBtn: {
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:      999,
    backgroundColor:   'rgba(255,255,255,0.22)',
    marginLeft:        'auto',
  },
  recordBtnText: {
    color:      '#FFFFFF',
    fontSize:   12,
    fontWeight: '700',
  },
  dots: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    marginTop:      Spacing['4'],
  },
  dot: {
    height:       6,
    borderRadius: 3,
  },
});
