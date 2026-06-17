import React, { memo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_SYMBOLS } from '@store/types';
import type { QuickStatCardProps } from '../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<string, IoniconName> = {
  income:  'arrow-down-circle',
  expense: 'arrow-up-circle',
  savings: 'wallet',
};

export const QuickStatCard = memo(function QuickStatCard({
  label,
  amount,
  type,
  currency,
}: QuickStatCardProps) {
  const { colors, isDark } = useTheme();
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';

  const baseColor =
    type === 'income'  ? colors.status.income  :
    type === 'expense' ? colors.status.expense :
                         colors.brand.primary;

  const amountColor =
    type === 'income'  ? colors.text.positive :
    type === 'expense' ? colors.text.negative :
                         colors.brand.primary;

  const gradient: [string, string] =
    type === 'income'  ? [colors.status.income,  colors.status.income  + '80'] :
    type === 'expense' ? [colors.status.expense, colors.status.expense + '80'] :
                         [colors.brand.primary,  colors.brand.primary  + '80'];

  // ─── Light Mode ────────────────────────────────────────────────────────────
  if (!isDark) {
    return (
      <View
        style={[
          styles.lightCard,
          {
            backgroundColor:  colors.surface.sheet,
            borderColor:      baseColor + '22',
            shadowColor:      baseColor,
          },
        ]}
      >
        {/* Subtle tinted bg */}
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.tintOverlay,
            { backgroundColor: baseColor + '08' },
          ]}
        />

        {/* Top row: icon + label */}
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: baseColor + '18' }]}>
            <Ionicons name={ICON_MAP[type]} size={18} color={baseColor} />
          </View>
          <AppText
            variant="labelSM"
            style={[styles.label, { color: baseColor }]}
          >
            {label.toUpperCase()}
          </AppText>
        </View>

        {/* Amount */}
        <AppText
          variant="headingSM"
          style={[styles.lightAmount, { color: colors.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {type === 'expense' ? '-' : '+'}{sym}{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </AppText>

        {/* Bottom gradient accent */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomBar}
        />
      </View>
    );
  }

  // ─── Dark Mode ─────────────────────────────────────────────────────────────
  return (
    <View
      style={[
        styles.darkCard,
        {
          backgroundColor: colors.background.secondary,
          borderColor:     baseColor + '28',
          shadowColor:     colors.black,
        },
      ]}
    >
      {/* Glow blob */}
      <View
        style={[
          styles.darkGlow,
          { backgroundColor: baseColor + '14' },
        ]}
      />

      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: baseColor + '22' }]}>
          <Ionicons name={ICON_MAP[type]} size={18} color={baseColor} />
        </View>
        <AppText
          variant="labelSM"
          style={[styles.label, { color: colors.text.secondary }]}
        >
          {label.toUpperCase()}
        </AppText>
      </View>

      <AppText
        variant="headingSM"
        style={[styles.darkAmount, { color: amountColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {type === 'expense' ? '-' : '+'}{sym}{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </AppText>

      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomBar}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  // ── Light card
  lightCard: {
    flex:         1,
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
    padding:      Spacing['4'],
    gap:          Spacing['2'],
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius:  10,
      },
      android: { elevation: 3 },
    }),
  },
  tintOverlay: {
    borderRadius: Radius.xl,
  },
  // ── Dark card
  darkCard: {
    flex:         1,
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
    padding:      Spacing['4'],
    gap:          Spacing['2'],
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius:  12,
      },
      android: { elevation: 4 },
    }),
  },
  darkGlow: {
    position:     'absolute',
    top:          -20,
    right:        -20,
    width:        80,
    height:       80,
    borderRadius: 40,
  },
  // ── Shared
  topRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  iconCircle: {
    width:          34,
    height:         34,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    fontSize:      10,
    letterSpacing: 0.8,
    fontWeight:    '700',
    flex:          1,
  },
  lightAmount: {
    fontSize:    20,
    fontWeight:  '800',
    letterSpacing: -0.5,
    lineHeight:  26,
  },
  darkAmount: {
    fontSize:    20,
    fontWeight:  '800',
    letterSpacing: -0.5,
    lineHeight:  26,
  },
  bottomBar: {
    position:     'absolute',
    bottom:       0,
    left:         0,
    right:        0,
    height:       3,
  },
});
