/**
 * @file TrendLineChart.tsx
 * @architecture Presentation Layer — UI Component
 * @description SVG-based curve rendering trend lines with touch targets and absolute coordinate tracking.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop, Line, Rect, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Radius } from '@constants/index';

interface Props {
  /** Array of trend points containing labels and values */
  points: { label: string; value: number }[];
  /** Resolved theme colors object */
  colors: any;
  /** Whether the dark theme is active */
  isDark: boolean;
  /** Currency abbreviation formatter function */
  formatAmount: (n: number) => string;
  /** Fixed height of the chart */
  chartHeight?: number;
  /** Width boundary of the chart */
  chartWidth: number;
  /** Whether the chart is expanded in fullscreen */
  isFullscreen?: boolean;
}

export function TrendLineChart({
  points,
  colors,
  isDark,
  formatAmount,
  chartHeight = 100,
  chartWidth,
  isFullscreen = false,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const DOT_R = isFullscreen ? 6 : 5;
  const PADDING_V = isFullscreen ? 24 : 16;
  const PADDING_H = 20;
  const CHART_H = chartHeight;
  const CHART_W = chartWidth;
  const DRAW_H = CHART_H - PADDING_V * 2;
  const DRAW_W = CHART_W - PADDING_H * 2;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const getY = (v: number) => PADDING_V + DRAW_H - ((v - minVal) / range) * DRAW_H;
  const getX = (i: number) => points.length > 1 ? PADDING_H + (i / (points.length - 1)) * DRAW_W : CHART_W / 2;

  const handleDotTap = useCallback((idx: number) => {
    Haptics.selectionAsync();
    setSelectedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  if (points.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="caption" color={colors.text.tertiary}>Not enough data for trend</AppText>
      </View>
    );
  }

  const buildPath = () => {
    let d = `M ${getX(0)} ${getY(points[0].value)}`;
    for (let i = 1; i < points.length; i++) {
      const x0 = getX(i - 1), y0 = getY(points[i - 1].value);
      const x1 = getX(i),     y1 = getY(points[i].value);
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  };

  const buildAreaPath = () => {
    let d = buildPath();
    d += ` L ${getX(points.length - 1)} ${CHART_H}`;
    d += ` L ${getX(0)} ${CHART_H} Z`;
    return d;
  };

  const linePath = buildPath();
  const areaPath = buildAreaPath();
  const zeroY = getY(0);

  return (
    <View>
      {/* Selected tooltip */}
      {selectedIdx !== null && points[selectedIdx] && (
        <View style={[s.tooltip, {
          backgroundColor: isDark ? 'rgba(40,40,50,0.96)' : 'rgba(255,255,255,0.96)',
          borderColor: colors.glass.border,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }]}>
          <AppText style={{ fontSize: 11, fontWeight: '800', color: colors.text.primary }}>
            {points[selectedIdx].label}
          </AppText>
          <AppText style={{ fontSize: 13, fontWeight: '800', color: points[selectedIdx].value >= 0 ? '#6C63FF' : '#EF4444' }}>
            {points[selectedIdx].value >= 0 ? '+' : ''}{formatAmount(points[selectedIdx].value)}
          </AppText>
        </View>
      )}

      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <SvgGrad id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6C63FF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#6C63FF" stopOpacity="0.02" />
          </SvgGrad>
          <SvgGrad id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#6C63FF" />
            <Stop offset="100%" stopColor="#38BDF8" />
          </SvgGrad>
        </Defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => {
          const y = PADDING_V + DRAW_H - pct * DRAW_H;
          return (
            <Line
              key={pct}
              x1={0}
              y1={y}
              x2={CHART_W}
              y2={y}
              stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Zero line */}
        {minVal < 0 && (
          <Line
            x1={0}
            y1={zeroY}
            x2={CHART_W}
            y2={zeroY}
            stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}
            strokeWidth={1}
            strokeDasharray="6,3"
          />
        )}

        {/* Area fill */}
        <Path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <Path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth={2.5} strokeLinecap="round" />

        {/* Selected vertical indicator line */}
        {selectedIdx !== null && (
          <Line
            x1={getX(selectedIdx)}
            y1={PADDING_V}
            x2={getX(selectedIdx)}
            y2={CHART_H}
            stroke="#6C63FF"
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.5}
          />
        )}

        {/* Dots */}
        {points.map((pt, i) => {
          const cx = getX(i);
          const cy = getY(pt.value);
          const isPositive = pt.value >= 0;
          const isSelected = selectedIdx === i;
          return (
            <G key={i}>
              <Rect
                x={cx - 16}
                y={cy - 16}
                width={32}
                height={32}
                fill="transparent"
                onPress={() => handleDotTap(i)}
              />
              {isSelected && (
                <Circle cx={cx} cy={cy} r={DOT_R + 5} fill={isPositive ? '#6C63FF' + '20' : '#EF4444' + '20'} />
              )}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? DOT_R : DOT_R - 1}
                fill={isPositive ? '#6C63FF' : '#EF4444'}
                stroke={colors.background.secondary}
                strokeWidth={2}
              />
            </G>
          );
        })}
      </Svg>

      {/* Labels */}
      <View style={[s.trendLabels, { height: 24, position: 'relative', width: CHART_W }]}>
        {points.map((pt, i) => {
          const cx = getX(i);
          const isSelected = selectedIdx === i;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: cx - 30,
                width: 60,
                alignItems: 'center',
              }}
            >
              <AppText
                style={[
                  s.barLabel,
                  {
                    color: isSelected ? colors.text.primary : colors.text.tertiary,
                    fontWeight: isSelected ? '800' : '600',
                    fontSize: 9,
                  },
                ]}
              >
                {pt.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
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
  trendLabels: {
    flexDirection: 'row',
    marginTop: 8,
  },
  barLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
