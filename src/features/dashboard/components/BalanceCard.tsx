import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AppText } from '@components/AppText';
import { Radius, Spacing, BlurConfigs } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_SYMBOLS } from '@store/types';
import type { BalanceCardProps } from '../types';

const CARD_HEIGHT = Math.max(Math.round(Dimensions.get('window').height * 0.22), 200);

function formatBalance(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const BalanceCard = memo(function BalanceCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
}: BalanceCardProps) {
  const { isDark, colors } = useTheme();

  if (!isDark) {
    return <LightCard totalBalance={totalBalance} monthSummary={monthSummary} isLoading={isLoading} currency={currency} />;
  }
  return <DarkCard totalBalance={totalBalance} monthSummary={monthSummary} isLoading={isLoading} currency={currency} />;
});

const LightCard = memo(function LightCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
}: BalanceCardProps) {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  return (
    <View style={[styles.container, lightStyles.container]}>
      {/* Background neon gradient base */}
      <LinearGradient
        colors={['#C4F135', '#D9FF5A', '#E3FF8C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />

      {/* Decorative large shapes placed behind the blur to appear as liquid refractive elements */}
      <Text style={styles.decorAsterisk} allowFontScaling={false}>✳</Text>
      <Text style={styles.decorAsteriskSm} allowFontScaling={false}>✳</Text>

      {/* Glassmorphic frosted blur layer */}
      <BlurView
        intensity={70}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />

      {/* Liquid glow orbs to refract light */}
      <View style={lightStyles.glowTopRight} />
      <View style={lightStyles.glowBottomLeft} />
      <View style={[lightStyles.border, { borderRadius: Radius['2xl'] }]} />

      <View style={styles.content}>
        {/* Top row: card name + currency */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardNameRow}>
            <View style={styles.toggleTrack}>
              <View style={styles.toggleThumb} />
            </View>
            <AppText
              variant="labelMD"
              color="#0A0A0A"
              style={styles.cardName}
            >
              MoneyCard
            </AppText>
          </View>
          <View style={styles.currencyChip}>
            <AppText variant="labelSM" color="#0A0A0A">{currency}</AppText>
          </View>
        </View>

        {/* Card number strip */}
        <View style={styles.cardNumberStrip}>
          <AppText variant="labelMD" color="#FFFFFF" style={styles.cardDots}>
            ●●●●  ●●●●  ●●●●  4829
          </AppText>
        </View>

        {/* Bottom row: balance + expiry */}
        <View style={styles.cardBottomRow}>
          <View>
            <AppText variant="labelSM" color="rgba(0,0,0,0.55)" style={styles.balanceLabel}>
              Your Balance
            </AppText>
            {isLoading ? (
              <ActivityIndicator size="small" color="#0A0A0A" style={styles.loader} />
            ) : (
              <AppText
                variant="numericLG"
                color="#0A0A0A"
                style={styles.balanceAmount}
              >
                {sym}{formatBalance(totalBalance)}
              </AppText>
            )}
          </View>
          <AppText variant="labelMD" color="rgba(0,0,0,0.6)">
            09/26
          </AppText>
        </View>
      </View>
    </View>
  );
});

const DarkCard = memo(function DarkCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
}: BalanceCardProps) {
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';
  return (
    <View style={[styles.container, darkStyles.container]}>
      {/* Background gradient base */}
      <LinearGradient
        colors={['#18103A', '#0A051C', '#040712']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />
      <BlurView
        intensity={BlurConfigs.card.intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />
      <View style={darkStyles.glowTopRight} />
      <View style={darkStyles.glowBottomLeft} />
      <View style={[darkStyles.border, { borderRadius: Radius['2xl'] }]} />

      <View style={styles.content}>
        <AppText variant="labelMD" color="rgba(148,163,184,0.9)" style={darkStyles.label}>
          TOTAL BALANCE
        </AppText>
        {isLoading ? (
          <ActivityIndicator size="small" color="#A78BFA" style={styles.loader} />
        ) : (
          <AppText variant="numericLG" color="#F1F5F9" style={darkStyles.balance}>
            {sym}{formatBalance(totalBalance)}
          </AppText>
        )}

        <View style={darkStyles.divider} />

        <View style={darkStyles.statsRow}>
          <View style={darkStyles.statItem}>
            <AppText variant="labelSM" color="rgba(148,163,184,0.8)">INCOME</AppText>
            <AppText variant="headingSM" color="#10B981">
              +{sym}{formatBalance(monthSummary.totalIncome)}
            </AppText>
          </View>
          <View style={darkStyles.statDivider} />
          <View style={darkStyles.statItem}>
            <AppText variant="labelSM" color="rgba(148,163,184,0.8)">EXPENSES</AppText>
            <AppText variant="headingSM" color="#EF4444">
              -{sym}{formatBalance(monthSummary.totalExpense)}
            </AppText>
          </View>
          <View style={darkStyles.statDivider} />
          <View style={darkStyles.statItem}>
            <AppText variant="labelSM" color="rgba(148,163,184,0.8)">SAVINGS</AppText>
            <AppText
              variant="headingSM"
              color={monthSummary.netSavings >= 0 ? '#10B981' : '#EF4444'}
            >
              {monthSummary.netSavings >= 0 ? '+' : '-'}{sym}{formatBalance(Math.abs(monthSummary.netSavings))}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: Spacing['5'],
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTrack: {
    width: 34,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  cardName: {
    fontWeight: '700',
  },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  cardNumberStrip: {
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: Spacing['4'],
    marginVertical: 2,
  },
  cardDots: {
    letterSpacing: 2,
    fontSize: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: Spacing['2'],
  },
  decorAsterisk: {
    position: 'absolute',
    right: -20,
    top: -40,
    fontSize: 200,
    color: 'rgba(0,0,0,0.07)',
    lineHeight: 210,
  },
  decorAsteriskSm: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    fontSize: 100,
    color: 'rgba(0,0,0,0.05)',
    lineHeight: 110,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#6C63FF',
    opacity: 0.12,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#38BDF8',
    opacity: 0.08,
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  label: {
    letterSpacing: 2,
  },
  balance: {
    color: '#F1F5F9',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Spacing['3'],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing['3'],
  },
});

const lightStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#C4F135',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  glowTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFFFFF',
    opacity: 0.35,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#38BDF8',
    opacity: 0.20,
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
});

