import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { CategoryIcon } from '@components/CategoryIcon';
import { GlassCard } from '@components/GlassCard';
import { getCategoryById } from '@store/categoryStore';
import { useTransactionStore } from '@store/transactionStore';
import { Spacing, Radius, FontFamily } from '@constants/index';
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
  const setFilters = useTransactionStore((s) => s.setFilters);
  const items = data.slice(0, MAX_ITEMS);

  const handleCategoryPress = (category: string) => {
    setFilters({ category, type: 'expense', searchQuery: '' });
    router.push('/(tabs)/transactions');
  };

  return (
    <GlassCard padding={0} style={{ borderColor: colors.status.expense + '30', borderWidth: 1 }}>
      {isLoading ? (
        <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <AppText variant="bodySM" color={colors.text.tertiary} align="center" style={styles.empty}>
          No spending data yet
        </AppText>
      ) : (
        <View style={styles.list}>
          {items.map((item, idx) => {
            const cat = getCategoryById(item.category);
            const catColor = cat.color;
            const catLabel = cat.label;
            const gradient: [string, string] = [catColor, catColor + '50'];

            return (
              <Pressable
                key={item.category}
                onPress={() => handleCategoryPress(item.category)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderBottomWidth: idx < items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.glass.border,
                    opacity: pressed ? 0.75 : 1,
                  }
                ]}
              >
                <CategoryIcon category={item.category} size={44} />
                <View style={styles.rowContent}>
                  <View style={styles.rowHeader}>
                    <AppText variant="labelLG" color={colors.text.primary} style={styles.categoryLabel}>
                      {catLabel}
                    </AppText>
                    <AppText variant="labelLG" color={colors.text.primary} style={styles.rowAmount}>
                      {symbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </AppText>
                  </View>

                  <View style={styles.rowSubHeader}>
                    <AppText variant="caption" color={colors.text.tertiary}>
                      {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </AppText>
                    <AppText variant="caption" color={colors.brand.secondary} style={styles.percentText}>
                      {item.percentage.toFixed(1)}% of total
                    </AppText>
                  </View>

                  <ProgressBar
                    progress={item.percentage / 100}
                    gradient={gradient}
                    height={6}
                    style={styles.bar}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  loader: { marginVertical: Spacing['8'] },
  empty:  { marginVertical: Spacing['8'] },
  list:   {},
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
  },
  rowContent: { flex: 1, gap: 4 },
  rowHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  categoryLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
  },
  rowAmount: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
  },
  rowSubHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  percentText: {
    fontWeight: '600',
  },
  bar: { marginVertical: 2 },
});
