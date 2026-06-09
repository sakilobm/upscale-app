import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { QuickStatCardProps } from '../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<string, IoniconName> = {
  income: 'arrow-down-circle',
  expense: 'arrow-up-circle',
  savings: 'wallet',
};

export const QuickStatCard = memo(function QuickStatCard({
  label,
  amount,
  type,
}: QuickStatCardProps) {
  const { colors } = useTheme();
  const gradient = type === 'income' ? colors.gradients.income :
                   type === 'expense' ? colors.gradients.expense :
                   colors.gradients.savings;

  return (
    <GlassCard style={styles.card} padding={Spacing['4']} borderRadius={Radius.lg}>
      <View style={styles.row}>
        <View style={[styles.iconWrapper, { backgroundColor: gradient[0] + '22' }]}>
          <Ionicons name={ICON_MAP[type]} size={20} color={gradient[0]} />
        </View>
        <View style={styles.textGroup}>
          <AppText variant="labelSM" color={colors.text.secondary}>
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
  card: { flex: 1, minWidth: 140 },
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
  textGroup: { flex: 1, gap: 2 },
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
