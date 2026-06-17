import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { CategoryIcon } from '@components/CategoryIcon';
import { getCategoryById } from '@store/categoryStore';
import { Spacing, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import type { SpendingChartProps } from '../types';

const MAX_ITEMS = 5;

export const SpendingChart = memo(function SpendingChart({
  data,
  isLoading,
}: SpendingChartProps) {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();
  const items = data.slice(0, MAX_ITEMS);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.sheet,
          borderColor:     colors.glass.backgroundMid,
          shadowColor:     colors.black,
        },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="headingSM" color={colors.text.primary}>Spending Breakdown</AppText>
        <View style={[styles.monthPill, { backgroundColor: colors.brand.primary + '22' }]}>
          <AppText variant="labelSM" style={{ color: colors.brand.secondary, fontSize: 11 }}>
            This Month
          </AppText>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <AppText variant="bodySM" color={colors.text.tertiary} align="center" style={styles.empty}>
          No spending data yet
        </AppText>
      ) : (
        <View style={styles.list}>
          {items.map((item, idx) => {
            const catColor = getCategoryById(item.category).color;
            const gradient: [string, string] = [catColor, catColor + '80'];
            return (
              <View key={item.category} style={[styles.row, idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.glass.background }]}>
                <CategoryIcon category={item.category} size={38} />
                <View style={styles.rowContent}>
                  <View style={styles.rowHeader}>
                    <AppText variant="labelMD" color={colors.text.primary}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </AppText>
                    <AppText variant="labelMD" color={colors.text.primary} style={styles.rowAmount}>
                      {symbol}{item.amount.toFixed(0)}
                    </AppText>
                  </View>
                  <ProgressBar
                    progress={item.percentage / 100}
                    gradient={gradient}
                    height={5}
                    style={styles.bar}
                  />
                  <AppText variant="caption" color={colors.text.tertiary}>
                    {item.percentage.toFixed(1)}% of total
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius:  12,
      },
      android: { elevation: 2 },
    }),
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        Spacing['5'],
    paddingBottom:  Spacing['3'],
  },
  monthPill: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      Radius.full,
  },
  loader: { marginVertical: Spacing['8'] },
  empty:  { marginVertical: Spacing['8'] },
  list:   {},
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
  },
  rowContent: { flex: 1, gap: 4 },
  rowHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  rowAmount: {
    fontWeight: '700',
  },
  bar: { marginVertical: 2 },
});
