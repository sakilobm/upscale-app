import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Colors, Radius, Shadow, Spacing, BlurConfigs } from '@constants/index';
import type { BalanceCardProps } from '../types';

const CONSTANTS = {
  cardHeight: 220,
  borderRadius: Radius['2xl'],
} as const;

export const BalanceCard = memo(function BalanceCard({
  totalBalance,
  monthSummary,
  isLoading,
}: BalanceCardProps) {
  return (
    <View
      style={[
        styles.container,
        Shadow.brand,
        { height: CONSTANTS.cardHeight, borderRadius: CONSTANTS.borderRadius },
      ]}
    >
      <LinearGradient
        colors={['#1A1040', '#0D0820', '#070B14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: CONSTANTS.borderRadius }]}
      />
      <BlurView
        intensity={BlurConfigs.card.intensity}
        tint={BlurConfigs.card.tint}
        style={[StyleSheet.absoluteFill, { borderRadius: CONSTANTS.borderRadius }]}
      />

      {/* Accent glow circles */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      {/* Border shimmer */}
      <View style={[styles.border, { borderRadius: CONSTANTS.borderRadius }]} />

      {/* Content */}
      <View style={styles.content}>
        <AppText variant="labelMD" color={Colors.text.secondary} style={styles.label}>
          TOTAL BALANCE
        </AppText>

        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={Colors.brand.secondary}
            style={styles.loader}
          />
        ) : (
          <AmountText
            amount={totalBalance}
            type="balance"
            variant="numericLG"
            style={styles.balanceText}
          />
        )}

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AppText variant="labelSM" color={Colors.text.secondary}>
              INCOME
            </AppText>
            <AmountText
              amount={monthSummary.totalIncome}
              type="income"
              variant="headingSM"
              showSign
            />
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText variant="labelSM" color={Colors.text.secondary}>
              EXPENSES
            </AppText>
            <AmountText
              amount={monthSummary.totalExpense}
              type="expense"
              variant="headingSM"
              showSign
            />
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <AppText variant="labelSM" color={Colors.text.secondary}>
              SAVINGS
            </AppText>
            <AmountText
              amount={monthSummary.netSavings}
              type={monthSummary.netSavings >= 0 ? 'income' : 'expense'}
              variant="headingSM"
              showSign
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
    borderColor: Colors.glass.borderStrong,
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.brand.primary,
    opacity: 0.12,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.brand.accent,
    opacity: 0.08,
  },
  content: {
    flex: 1,
    padding: Spacing['6'],
    justifyContent: 'space-between',
  },
  label: {
    letterSpacing: 2,
    marginBottom: Spacing['1'],
  },
  balanceText: {
    color: Colors.text.primary,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: Spacing['2'],
  },
  divider: {
    height: 1,
    backgroundColor: Colors.glass.border,
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
    backgroundColor: Colors.glass.border,
    marginHorizontal: Spacing['3'],
  },
});
