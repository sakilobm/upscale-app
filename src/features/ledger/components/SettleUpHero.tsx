import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Radius, Spacing } from '@constants/Dimensions';

interface SettleUpHeroProps {
  totalOwedToMe: number;
  totalIOwe:     number;
}

export function SettleUpHero({ totalOwedToMe, totalIOwe }: SettleUpHeroProps) {
  const { colors, isDark } = useTheme();
  const { symbol: currency } = useFormatCurrency();
  const net       = totalOwedToMe - totalIOwe;
  const isPositive = net >= 0;

  const cardBg: [string, string] = isDark
    ? ['rgba(13, 18, 32, 0.82)', 'rgba(8, 12, 20, 0.90)']
    : ['rgba(255, 255, 255, 0.88)', 'rgba(245, 247, 250, 0.94)'];

  const netColor = isPositive ? colors.status.income : colors.status.expense;
  const netLabel = isPositive
    ? 'You are owed'
    : 'You owe in total';

  return (
    <View style={styles.wrapper}>
      <BlurView
        intensity={isDark ? 55 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={cardBg}
        style={StyleSheet.absoluteFill}
      />
      {/* Border */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius:  Radius['2xl'],
            borderWidth:   1,
            borderColor:   isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
          },
        ]}
        pointerEvents="none"
      />

      <View style={styles.inner}>
        {/* Net summary */}
        <View style={styles.netSection}>
          <View
            style={[
              styles.netIcon,
              { backgroundColor: netColor + (isDark ? '25' : '18') },
            ]}
          >
            <Ionicons
              name={isPositive ? 'arrow-down' : 'arrow-up'}
              size={18}
              color={netColor}
            />
          </View>
          <View style={styles.netText}>
            <AppText variant="caption" color={colors.text.secondary}>
              {netLabel}
            </AppText>
            <AppText
              variant="numericLG"
              style={[styles.netAmount, { color: netColor }]}
            >
              {currency}{Math.abs(net).toFixed(2)}
            </AppText>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.glass.border }]} />

        {/* Breakdown row */}
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <View style={[styles.dot, { backgroundColor: colors.status.income }]} />
            <View>
              <AppText variant="caption" color={colors.text.tertiary}>Owed to you</AppText>
              <AppText variant="labelLG" color={colors.status.income}>
                {currency}{totalOwedToMe.toFixed(2)}
              </AppText>
            </View>
          </View>
          <View style={styles.breakdownItem}>
            <View style={[styles.dot, { backgroundColor: colors.status.expense }]} />
            <View>
              <AppText variant="caption" color={colors.text.tertiary}>You owe</AppText>
              <AppText variant="labelLG" color={colors.status.expense}>
                {currency}{totalIOwe.toFixed(2)}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius:   Radius['2xl'],
    overflow:       'hidden',
    marginBottom:   Spacing['4'],
  },
  inner: {
    padding: Spacing['5'],
  },
  netSection: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['3'],
    marginBottom:  Spacing['4'],
  },
  netIcon: {
    width:          42,
    height:         42,
    borderRadius:   21,
    alignItems:     'center',
    justifyContent: 'center',
  },
  netText: {
    gap: 2,
  },
  netAmount: {
    fontSize:   28,
    lineHeight: 34,
  },
  divider: {
    height:        1,
    marginBottom:  Spacing['4'],
  },
  breakdown: {
    flexDirection: 'row',
    gap:           Spacing['6'],
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
});
