import React, { memo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { CategoryIcon, CATEGORY_META } from '@components/CategoryIcon';
import { Colors, Spacing, Radius } from '@constants/index';
import type { SpendingChartProps } from '../types';

const CONSTANTS = {
  maxItems: 5,
} as const;

export const SpendingChart = memo(function SpendingChart({
  data,
  isLoading,
}: SpendingChartProps) {
  const items = data.slice(0, CONSTANTS.maxItems);

  return (
    <GlassCard style={styles.card} padding={Spacing['5']}>
      <View style={styles.header}>
        <AppText variant="headingSM">Spending Breakdown</AppText>
        <AppText variant="labelSM" color={Colors.text.secondary}>
          This Month
        </AppText>
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={Colors.brand.primary}
          style={styles.loader}
        />
      ) : items.length === 0 ? (
        <AppText
          variant="bodySM"
          color={Colors.text.tertiary}
          align="center"
          style={styles.empty}
        >
          No spending data yet
        </AppText>
      ) : (
        <View style={styles.list}>
          {items.map((item) => {
            const meta = CATEGORY_META[item.category];
            const gradient: [string, string] = [meta.color, meta.color + '80'];
            return (
              <View key={item.category} style={styles.row}>
                <CategoryIcon category={item.category} size={38} />
                <View style={styles.rowContent}>
                  <View style={styles.rowHeader}>
                    <AppText variant="labelMD" color={Colors.text.primary}>
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </AppText>
                    <AppText variant="labelMD" color={Colors.text.primary}>
                      ${item.amount.toFixed(0)}
                    </AppText>
                  </View>
                  <ProgressBar
                    progress={item.percentage / 100}
                    gradient={gradient}
                    height={5}
                    style={styles.bar}
                  />
                  <AppText variant="caption" color={Colors.text.tertiary}>
                    {item.percentage.toFixed(1)}% of total
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  loader: {
    marginVertical: Spacing['8'],
  },
  empty: {
    marginVertical: Spacing['8'],
  },
  list: {
    gap: Spacing['4'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bar: {
    marginVertical: 2,
  },
});
