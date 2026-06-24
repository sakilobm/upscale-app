/**
 * @file CashFlowChart.tsx
 * @architecture Presentation Layer — UI Component
 * @description Double-bar chart rendering cash flow (incomes/expenses) with tooltip selectors and grid boundaries.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import type { CashFlowBar } from '@features/analytics/hooks/useAnalyticsScreen';
import { Radius } from '@constants/index';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  /** Array of cash flow bars data containing labels, income, and expenses */
  bars: CashFlowBar[];
  /** Resolved theme colors object */
  colors: any;
  /** Whether the dark theme is active */
  isDark: boolean;
  /** Currency abbreviation formatter function */
  formatAmount: (n: number) => string;
  /** Fixed height of the chart */
  chartHeight: number;
  /** Whether the chart is presented in full-screen expanded mode */
  isFullscreen?: boolean;
}

export function CashFlowChart({
  bars,
  colors,
  isDark,
  formatAmount,
  chartHeight,
  isFullscreen = false,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const maxVal = Math.max(...bars.map((b) => Math.max(b.income, b.expense)), 1);
  // Add 20% headroom so bars never touch the container top during data variance
  const scaledMax = maxVal * 1.20;
  const CHART_H = chartHeight;
  const barWidth = isFullscreen
    ? Math.min(32, (SCREEN_W - 64) / bars.length / 2.5)
    : Math.min(24, (SCREEN_W - 80) / bars.length / 2.5);

  const handleBarTap = useCallback((idx: number) => {
    Haptics.selectionAsync();
    setSelectedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <View style={s.barChartContainer}>
      {/* Grid lines + Y-axis labels */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <View key={pct} style={{ position: 'absolute', bottom: pct * CHART_H + 24, left: 0, right: 0 }}>
          <View
            style={[
              s.gridLine,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ]}
          />
          {isFullscreen && (
            <AppText style={{ position: 'absolute', left: -4, top: -8, fontSize: 8, color: colors.text.tertiary, fontWeight: '600' }}>
              {formatAmount(scaledMax * pct)}
            </AppText>
          )}
        </View>
      ))}

      {/* Selected tooltip */}
      {selectedIdx !== null && bars[selectedIdx] && (
        <View style={[s.tooltip, {
          backgroundColor: isDark ? 'rgba(40,40,50,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: colors.glass.border,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }]}>
          <AppText style={{ fontSize: 11, fontWeight: '800', color: colors.text.primary }}>
            {bars[selectedIdx].label}
          </AppText>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
              <AppText style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
                {formatAmount(bars[selectedIdx].income)}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
              <AppText style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>
                {formatAmount(bars[selectedIdx].expense)}
              </AppText>
            </View>
          </View>
          <AppText style={{ fontSize: 10, fontWeight: '700', color: bars[selectedIdx].net >= 0 ? '#10B981' : '#EF4444' }}>
            Net: {bars[selectedIdx].net >= 0 ? '+' : ''}{formatAmount(bars[selectedIdx].net)}
          </AppText>
        </View>
      )}

      {/* Bar Column Row */}
      <View style={[s.barChartRow, { height: CHART_H + 24, marginTop: 20 }]}>
        {bars.map((bar, i) => {
          const isSelected = selectedIdx === i;
          return (
            <Pressable
              key={i}
              onPress={() => handleBarTap(i)}
              style={[s.barColumn, { opacity: selectedIdx !== null && !isSelected ? 0.4 : 1 }]}
            >
              <View style={[s.barsContainer, { height: CHART_H }]}>
                <View style={s.barPair}>
                  {/* Income bar */}
                  <View
                    style={[
                      s.bar,
                      {
                        height: Math.max((bar.income / scaledMax) * CHART_H, 2),
                        width: barWidth,
                        backgroundColor: '#10B981',
                        borderRadius: barWidth / 2,
                      },
                    ]}
                  />
                  {/* Expense bar */}
                  <View
                    style={[
                      s.bar,
                      {
                        height: Math.max((bar.expense / scaledMax) * CHART_H, 2),
                        width: barWidth,
                        backgroundColor: '#EF4444',
                        borderRadius: barWidth / 2,
                      },
                    ]}
                  />
                </View>
              </View>
              <AppText style={[s.barLabel, { color: isSelected ? colors.text.primary : colors.text.tertiary, fontWeight: isSelected ? '800' : '600', marginTop: 6 }]}>
                {bar.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  barChartContainer: {
    position: 'relative',
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  barColumn: {
    alignItems: 'center',
  },
  barsContainer: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    minHeight: 2,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    zIndex: 10,
    gap: 3,
    alignItems: 'center',
  },
});
