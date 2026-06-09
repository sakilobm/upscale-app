import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Colors, Radius, Spacing, Shadow } from '@constants/index';
import type { QuickStatCardProps } from '../types';

const GRADIENT_MAP = {
  income: Colors.gradients.income,
  expense: Colors.gradients.expense,
  savings: Colors.gradients.savings,
} as const;

export const QuickStatCard = memo(function QuickStatCard({
  label,
  amount,
  type,
  iconEmoji,
}: QuickStatCardProps) {
  const gradient = GRADIENT_MAP[type];

  return (
    <GlassCard
      style={styles.card}
      padding={Spacing['4']}
      borderRadius={Radius.lg}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrapper, { backgroundColor: gradient[0] + '25' }]}>
          <AppText style={styles.emoji}>{iconEmoji}</AppText>
        </View>
        <View style={styles.textGroup}>
          <AppText variant="labelSM" color={Colors.text.secondary}>
            {label.toUpperCase()}
          </AppText>
          <AmountText
            amount={amount}
            type={type === 'savings' ? 'savings' : type}
            variant="headingSM"
            showSign={false}
          />
        </View>
      </View>
      {/* Bottom gradient accent line */}
      <LinearGradient
        colors={[...gradient] as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.accent}
      />
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderBottomLeftRadius: Radius.lg,
    borderBottomRightRadius: Radius.lg,
    opacity: 0.8,
  },
});
