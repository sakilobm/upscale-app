/**
 * @file analytics.tsx
 * @architecture Presentation Layer — Screen (View Shell)
 * @description Full-fledged advanced analytics screen with period-switchable
 *   (weekly/monthly/yearly) financial analysis. Features interactive cash-flow bar
 *   charts with tap tooltips, SVG-based savings trend lines with perfect dot-line
 *   alignment, category donut breakdowns, growth metrics, budget health, loan &
 *   ledger summaries, smart insight cards, and fullscreen chart expansion mode.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop, Line, Rect, G } from 'react-native-svg';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Radius, FontFamily } from '@constants/index';
import {
  useAnalyticsScreen,
  type PeriodMode,
  type CashFlowBar,
  type CategorySlice,
  type GrowthMetric,
  type SmartInsight,
} from '@features/analytics/hooks/useAnalyticsScreen';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Period pill config ──────────────────────────────────────────────────────
const PERIODS: { key: PeriodMode; label: string; icon: string }[] = [
  { key: 'weekly',  label: 'Week',  icon: 'calendar-outline' },
  { key: 'monthly', label: 'Month', icon: 'today-outline' },
  { key: 'yearly',  label: 'Year',  icon: 'albums-outline' },
];

// ─── Fullscreen chart modal ──────────────────────────────────────────────────
interface FullscreenChartProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function FullscreenChart({ visible, onClose, title, children }: FullscreenChartProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[fs.root, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {/* Header bar */}
        <View style={fs.header}>
          <AppText variant="headingSM" color={colors.text.primary} style={{ fontWeight: '700', flex: 1 }}>
            {title}
          </AppText>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            style={[fs.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <Ionicons name="close" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
        {/* Chart area */}
        <View style={fs.chartArea}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const fs = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chartArea: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
});

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { symbol } = useFormatCurrency();
  const analytics = useAnalyticsScreen();

  const [fullscreenChart, setFullscreenChart] = useState<'cashflow' | 'trend' | null>(null);

  const cardBg       = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  const fmtAmount = (n: number) => {
    if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${symbol}${(n / 1_000).toFixed(1)}K`;
    return `${symbol}${n.toFixed(0)}`;
  };

  const fmtFull = (n: number) =>
    `${symbol}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View style={[s.root, { backgroundColor: colors.background.primary }]}>      
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════════
            HEADER: Back + Title + Period Selector
           ══════════════════════════════════════════════════════════════════ */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="headingSM" color={colors.text.primary} style={{ fontWeight: '700' }}>
              Analytics
            </AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{analytics.periodLabel}</AppText>
          </View>
        </View>

        {/* Period pills */}
        <View style={s.periodRow}>
          {PERIODS.map((p) => {
            const active = analytics.period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  analytics.setPeriod(p.key);
                }}
                style={[
                  s.periodPill,
                  {
                    backgroundColor: active ? colors.brand.primary : cardBg,
                    borderColor: active ? colors.brand.primary : colors.glass.border,
                  },
                ]}
              >
                <Ionicons name={p.icon as any} size={14} color={active ? '#FFF' : colors.text.secondary} />
                <AppText
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: active ? '#FFF' : colors.text.secondary,
                  }}
                >
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            HERO: Overview Summary with Net Worth
           ══════════════════════════════════════════════════════════════════ */}
        <View style={[s.heroCard, { borderColor: colors.brand.primary + '22' }]}>
          <LinearGradient
            colors={isDark ? ['rgba(108,99,255,0.12)', 'rgba(56,189,248,0.06)'] : ['rgba(108,99,255,0.08)', 'rgba(56,189,248,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Accent stripe */}
          <LinearGradient
            colors={['#6C63FF', '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.heroStripe}
          />

          <View style={s.heroTopRow}>
            <View>
              <AppText variant="caption" color={colors.text.tertiary} style={{ letterSpacing: 0.8, fontWeight: '600' }}>
                NET WORTH
              </AppText>
              <AppText style={[s.heroAmount, { color: colors.text.primary }]}>
                {fmtFull(analytics.totalBalance)}
              </AppText>
            </View>
            <View style={[s.heroNetBadge, { backgroundColor: analytics.currentAgg.net >= 0 ? '#10B981' + '18' : '#EF4444' + '18' }]}>
              <Ionicons
                name={analytics.currentAgg.net >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={analytics.currentAgg.net >= 0 ? '#10B981' : '#EF4444'}
              />
              <AppText style={{ fontSize: 11, fontWeight: '800', color: analytics.currentAgg.net >= 0 ? '#10B981' : '#EF4444' }}>
                {analytics.currentAgg.net >= 0 ? '+' : ''}{fmtAmount(analytics.currentAgg.net)}
              </AppText>
            </View>
          </View>

          {/* Quick stat trio */}
          <View style={s.heroStatsRow}>
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#10B981' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Income</AppText>
              <AppText style={[s.heroStatVal, { color: '#10B981' }]}>{fmtAmount(analytics.currentAgg.income)}</AppText>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: dividerColor }]} />
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#EF4444' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Expenses</AppText>
              <AppText style={[s.heroStatVal, { color: '#EF4444' }]}>{fmtAmount(analytics.currentAgg.expense)}</AppText>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: dividerColor }]} />
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#6C63FF' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Saved</AppText>
              <AppText style={[s.heroStatVal, { color: '#6C63FF' }]}>{fmtAmount(analytics.currentAgg.net)}</AppText>
            </View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            GROWTH METRICS
           ══════════════════════════════════════════════════════════════════ */}
        <SectionTitle title="GROWTH METRICS" />
        <View style={s.growthRow}>
          {analytics.growthMetrics.map((m) => (
            <GrowthCard key={m.label} metric={m} cardBg={cardBg} colors={colors} fmtAmount={fmtAmount} />
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CASH FLOW BAR CHART
           ══════════════════════════════════════════════════════════════════ */}
        <SectionTitle title="CASH FLOW" />
        <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          <View style={s.chartHeader}>
            <View style={s.chartLegend}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#10B981' }]} />
                <AppText variant="caption" color={colors.text.tertiary}>Income</AppText>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#EF4444' }]} />
                <AppText variant="caption" color={colors.text.tertiary}>Expense</AppText>
              </View>
            </View>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setFullscreenChart('cashflow'); }}
              hitSlop={10}
              style={[s.expandBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <Ionicons name="expand-outline" size={14} color={colors.text.tertiary} />
            </Pressable>
          </View>
          <CashFlowChart
            bars={analytics.cashFlowBars}
            colors={colors}
            isDark={isDark}
            fmtAmount={fmtAmount}
            chartHeight={140}
          />
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SAVINGS TREND LINE
           ══════════════════════════════════════════════════════════════════ */}
        <SectionTitle title="SAVINGS TREND" />
        <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          <View style={s.chartHeader}>
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600', letterSpacing: 0.4 }}>
              Net savings per period
            </AppText>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setFullscreenChart('trend'); }}
              hitSlop={10}
              style={[s.expandBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
            >
              <Ionicons name="expand-outline" size={14} color={colors.text.tertiary} />
            </Pressable>
          </View>
          <TrendLineChart
            points={analytics.savingsTrend}
            colors={colors}
            isDark={isDark}
            fmtAmount={fmtAmount}
            chartHeight={100}
            chartWidth={SCREEN_W - 80}
          />
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            CATEGORY BREAKDOWN
           ══════════════════════════════════════════════════════════════════ */}
        {analytics.categoryBreakdown.length > 0 && (
          <>
            <SectionTitle title="EXPENSE BREAKDOWN" />
            <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border, padding: 0 }]}>
              {/* Mini donut */}
              <View style={s.donutRow}>
                <MiniDonut slices={analytics.categoryBreakdown} size={80} />
                <View style={{ flex: 1, gap: 6 }}>
                  {analytics.categoryBreakdown.slice(0, 4).map((cat) => (
                    <View key={cat.id} style={s.catRow}>
                      <View style={[s.catDot, { backgroundColor: cat.color }]} />
                      <AppText variant="caption" color={colors.text.primary} style={{ flex: 1, fontWeight: '600' }}>
                        {cat.label}
                      </AppText>
                      <AppText variant="caption" color={colors.text.tertiary}>
                        {cat.percentage.toFixed(0)}%
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
              {/* Full list */}
              {analytics.categoryBreakdown.map((cat, i) => (
                <View
                  key={cat.id}
                  style={[
                    s.catListRow,
                    {
                      borderTopWidth: i === 0 ? 1 : 0,
                      borderTopColor: dividerColor,
                      borderBottomWidth: i < analytics.categoryBreakdown.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: dividerColor,
                    },
                  ]}
                >
                  <View style={[s.catIconCircle, { backgroundColor: cat.color + '18' }]}>
                    <View style={[s.catInnerDot, { backgroundColor: cat.color }]} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={s.catListHeader}>
                      <AppText style={{ fontSize: 13, fontWeight: '600', color: colors.text.primary }}>
                        {cat.label}
                      </AppText>
                      <AppText style={{ fontSize: 13, fontWeight: '700', color: colors.text.primary }}>
                        {fmtAmount(cat.amount)}
                      </AppText>
                    </View>
                    <ProgressBar
                      progress={cat.percentage / 100}
                      gradient={[cat.color, cat.color + '60']}
                      height={4}
                    />
                    <View style={s.catListSub}>
                      <AppText variant="caption" color={colors.text.tertiary}>
                        {cat.txCount} txn{cat.txCount !== 1 ? 's' : ''}
                      </AppText>
                      <AppText variant="caption" color={cat.color} style={{ fontWeight: '700' }}>
                        {cat.percentage.toFixed(1)}%
                      </AppText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            BUDGET HEALTH
           ══════════════════════════════════════════════════════════════════ */}
        {analytics.budgetUtilization.totalLimit > 0 && (
          <>
            <SectionTitle title="BUDGET HEALTH" />
            <View style={[s.budgetCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
              <View style={s.budgetTop}>
                <View style={[s.budgetIcon, { backgroundColor: (analytics.budgetUtilization.pct > 90 ? '#EF4444' : '#10B981') + '14' }]}>
                  <Ionicons
                    name={analytics.budgetUtilization.pct > 90 ? 'warning' : 'shield-checkmark'}
                    size={20}
                    color={analytics.budgetUtilization.pct > 90 ? '#EF4444' : '#10B981'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 13, fontWeight: '600', color: colors.text.primary }}>
                    {analytics.budgetUtilization.pct.toFixed(0)}% Budget Used
                  </AppText>
                  <AppText variant="caption" color={colors.text.tertiary}>
                    {fmtAmount(analytics.budgetUtilization.totalSpent)} of {fmtAmount(analytics.budgetUtilization.totalLimit)}
                  </AppText>
                </View>
                <AppText style={{ fontSize: 20, fontWeight: '800', color: analytics.budgetUtilization.pct > 90 ? '#EF4444' : '#10B981' }}>
                  {analytics.budgetUtilization.pct.toFixed(0)}%
                </AppText>
              </View>
              <ProgressBar
                progress={Math.min(analytics.budgetUtilization.pct / 100, 1)}
                gradient={analytics.budgetUtilization.pct > 90 ? ['#EF4444', '#F87171'] : ['#10B981', '#34D399']}
                height={6}
              />
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            LOANS & LEDGER SUMMARY
           ══════════════════════════════════════════════════════════════════ */}
        {(analytics.loanSummary.borrowedCount + analytics.loanSummary.lentCount > 0 ||
          analytics.ledgerSummary.activeEntries > 0) && (
          <>
            <SectionTitle title="LOANS & LEDGER" />
            <View style={s.llRow}>
              {/* Loans */}
              {(analytics.loanSummary.borrowedCount + analytics.loanSummary.lentCount > 0) && (
                <View style={[s.llCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
                  <LinearGradient colors={['#EC4899', '#8B5CF6']} style={s.llAccent} />
                  <View style={[s.llIconWrap, { backgroundColor: '#EC489918' }]}>
                    <Ionicons name="cash-outline" size={16} color="#EC4899" />
                  </View>
                  <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 0.6 }}>
                    LOANS
                  </AppText>
                  <View style={s.llStatRow}>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>Borrowed</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>
                        {fmtAmount(analytics.loanSummary.activeBorrowed)}
                      </AppText>
                    </View>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>Lent</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                        {fmtAmount(analytics.loanSummary.activeLent)}
                      </AppText>
                    </View>
                  </View>
                  {analytics.loanSummary.monthlyEmi > 0 && (
                    <AppText variant="caption" color={colors.text.tertiary}>
                      Monthly EMI: <AppText style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}>{fmtAmount(analytics.loanSummary.monthlyEmi)}</AppText>
                    </AppText>
                  )}
                </View>
              )}

              {/* Ledger */}
              {analytics.ledgerSummary.activeEntries > 0 && (
                <View style={[s.llCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
                  <LinearGradient colors={['#3B82F6', '#06B6D4']} style={s.llAccent} />
                  <View style={[s.llIconWrap, { backgroundColor: '#3B82F618' }]}>
                    <Ionicons name="people-outline" size={16} color="#3B82F6" />
                  </View>
                  <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 0.6 }}>
                    LEDGER
                  </AppText>
                  <View style={s.llStatRow}>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>Owed to me</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                        {fmtAmount(analytics.ledgerSummary.totalOwedToMe)}
                      </AppText>
                    </View>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>I owe</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>
                        {fmtAmount(analytics.ledgerSummary.totalIOwe)}
                      </AppText>
                    </View>
                  </View>
                  {analytics.ledgerSummary.overdueEntries > 0 && (
                    <View style={s.llOverdueBadge}>
                      <Ionicons name="alert-circle" size={10} color="#EF4444" />
                      <AppText style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>
                        {analytics.ledgerSummary.overdueEntries} Overdue
                      </AppText>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SMART INSIGHTS
           ══════════════════════════════════════════════════════════════════ */}
        {analytics.insights.length > 0 && (
          <>
            <SectionTitle title="SMART INSIGHTS" />
            <View style={s.insightsGrid}>
              {analytics.insights.map((ins) => (
                <View key={ins.id} style={[s.insightCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
                  <View style={[s.insightIcon, { backgroundColor: ins.color + '14' }]}>
                    <Ionicons name={ins.icon as any} size={18} color={ins.color} />
                  </View>
                  <View style={s.insightText}>
                    <AppText style={{ fontSize: 12.5, fontWeight: '700', color: colors.text.primary, lineHeight: 17 }}>
                      {ins.title}
                    </AppText>
                    <AppText variant="caption" color={colors.text.tertiary} style={{ lineHeight: 15 }}>
                      {ins.body}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════
          FULLSCREEN CHART MODALS
         ══════════════════════════════════════════════════════════════════ */}
      <FullscreenChart
        visible={fullscreenChart === 'cashflow'}
        onClose={() => setFullscreenChart(null)}
        title="Cash Flow"
      >
        <CashFlowChart
          bars={analytics.cashFlowBars}
          colors={colors}
          isDark={isDark}
          fmtAmount={fmtAmount}
          chartHeight={SCREEN_H * 0.55}
          isFullscreen
        />
      </FullscreenChart>

      <FullscreenChart
        visible={fullscreenChart === 'trend'}
        onClose={() => setFullscreenChart(null)}
        title="Savings Trend"
      >
        <TrendLineChart
          points={analytics.savingsTrend}
          colors={colors}
          isDark={isDark}
          fmtAmount={fmtAmount}
          chartHeight={SCREEN_H * 0.5}
          chartWidth={SCREEN_W - 40}
          isFullscreen
        />
      </FullscreenChart>
    </View>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <AppText style={[s.sectionTitle, { color: colors.text.tertiary }]}>
      {title}
    </AppText>
  );
}

/** Growth metric card */
function GrowthCard({
  metric,
  cardBg,
  colors,
  fmtAmount,
}: {
  metric: GrowthMetric;
  cardBg: string;
  colors: any;
  fmtAmount: (n: number) => string;
}) {
  const accentColor =
    metric.label === 'Income'   ? '#10B981' :
    metric.label === 'Expenses' ? '#EF4444' : '#6C63FF';

  return (
    <View style={[s.growthCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
      <View style={[s.growthAccent, { backgroundColor: accentColor }]} />
      <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600' }}>
        {metric.label}
      </AppText>
      <AppText style={{ fontSize: 17, fontWeight: '800', color: colors.text.primary }}>
        {fmtAmount(metric.current)}
      </AppText>
      <View style={s.growthBadgeRow}>
        <Ionicons
          name={metric.direction === 'up' ? 'caret-up' : metric.direction === 'down' ? 'caret-down' : 'remove'}
          size={10}
          color={
            metric.label === 'Expenses'
              ? (metric.direction === 'up' ? '#EF4444' : '#10B981')
              : (metric.direction === 'up' ? '#10B981' : '#EF4444')
          }
        />
        <AppText
          style={{
            fontSize: 10,
            fontWeight: '800',
            color: metric.label === 'Expenses'
              ? (metric.direction === 'up' ? '#EF4444' : '#10B981')
              : (metric.direction === 'up' ? '#10B981' : '#EF4444'),
          }}
        >
          {Math.abs(metric.changePct).toFixed(0)}%
        </AppText>
      </View>
    </View>
  );
}

// ─── Interactive Cash Flow Bar Chart ─────────────────────────────────────────

function CashFlowChart({
  bars,
  colors,
  isDark,
  fmtAmount,
  chartHeight = 140,
  isFullscreen = false,
}: {
  bars: CashFlowBar[];
  colors: any;
  isDark: boolean;
  fmtAmount: (n: number) => string;
  chartHeight?: number;
  isFullscreen?: boolean;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const maxVal = Math.max(...bars.map((b) => Math.max(b.income, b.expense)), 1);
  // Add 15% headroom so bars never touch the container top
  const scaledMax = maxVal * 1.15;
  const CHART_H = chartHeight;
  const barWidth = isFullscreen
    ? Math.min(32, (SCREEN_W - 64) / bars.length / 2.5)
    : Math.min(24, (SCREEN_W - 80) / bars.length / 2.5);

  const handleBarTap = useCallback((idx: number) => {
    Haptics.selectionAsync();
    setSelectedIdx(selectedIdx === idx ? null : idx);
  }, [selectedIdx]);

  return (
    <View style={s.barChartContainer}>
      {/* Grid lines + Y-axis labels */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <View key={pct} style={{ position: 'absolute', bottom: pct * CHART_H + 20, left: 0, right: 0 }}>
          <View
            style={[
              s.gridLine,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ]}
          />
          {isFullscreen && (
            <AppText style={{ position: 'absolute', left: -4, top: -8, fontSize: 8, color: colors.text.tertiary, fontWeight: '600' }}>
              {fmtAmount(scaledMax * pct)}
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
                {fmtAmount(bars[selectedIdx].income)}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
              <AppText style={{ fontSize: 10, fontWeight: '700', color: '#EF4444' }}>
                {fmtAmount(bars[selectedIdx].expense)}
              </AppText>
            </View>
          </View>
          <AppText style={{ fontSize: 10, fontWeight: '700', color: bars[selectedIdx].net >= 0 ? '#10B981' : '#EF4444' }}>
            Net: {bars[selectedIdx].net >= 0 ? '+' : ''}{fmtAmount(bars[selectedIdx].net)}
          </AppText>
        </View>
      )}

      <View style={[s.barChartRow, { height: CHART_H, marginTop: 20 }]}>
        {bars.map((bar, i) => {
          const isSelected = selectedIdx === i;
          return (
            <Pressable
              key={i}
              onPress={() => handleBarTap(i)}
              style={[s.barGroup, { opacity: selectedIdx !== null && !isSelected ? 0.4 : 1 }]}
            >
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
              <AppText style={[s.barLabel, { color: isSelected ? colors.text.primary : colors.text.tertiary, fontWeight: isSelected ? '800' : '600' }]}>
                {bar.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── SVG-based Interactive Trend Line Chart ──────────────────────────────────

function TrendLineChart({
  points,
  colors,
  isDark,
  fmtAmount,
  chartHeight = 100,
  chartWidth = SCREEN_W - 80,
  isFullscreen = false,
}: {
  points: { label: string; value: number }[];
  colors: any;
  isDark: boolean;
  fmtAmount: (n: number) => string;
  chartHeight?: number;
  chartWidth?: number;
  isFullscreen?: boolean;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const DOT_R = isFullscreen ? 6 : 5;
  const PADDING_V = isFullscreen ? 24 : 16; // vertical padding inside the chart area
  const CHART_H = chartHeight;
  const CHART_W = chartWidth;
  const DRAW_H = CHART_H - PADDING_V * 2; // drawable height between top/bottom padding

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  // Map value to Y coordinate with vertical padding
  const getY = (v: number) => PADDING_V + DRAW_H - ((v - minVal) / range) * DRAW_H;
  // Map index to X coordinate
  const getX = (i: number) => points.length > 1 ? (i / (points.length - 1)) * CHART_W : CHART_W / 2;

  if (points.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="caption" color={colors.text.tertiary}>Not enough data for trend</AppText>
      </View>
    );
  }

  // Build SVG path for smooth curve
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

  // Build area fill path (same curve + close to bottom)
  const buildAreaPath = () => {
    let d = buildPath();
    d += ` L ${getX(points.length - 1)} ${CHART_H}`;
    d += ` L ${getX(0)} ${CHART_H} Z`;
    return d;
  };

  const linePath = buildPath();
  const areaPath = buildAreaPath();

  // Zero line Y position
  const zeroY = getY(0);

  const handleDotTap = useCallback((idx: number) => {
    Haptics.selectionAsync();
    setSelectedIdx(selectedIdx === idx ? null : idx);
  }, [selectedIdx]);

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
            {points[selectedIdx].value >= 0 ? '+' : ''}{fmtAmount(points[selectedIdx].value)}
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

        {/* Dots — rendered last so they're on top */}
        {points.map((pt, i) => {
          const cx = getX(i);
          const cy = getY(pt.value);
          const isPositive = pt.value >= 0;
          const isSelected = selectedIdx === i;
          return (
            <G key={i}>
              {/* Larger invisible tap target */}
              <Rect
                x={cx - 16}
                y={cy - 16}
                width={32}
                height={32}
                fill="transparent"
                onPress={() => handleDotTap(i)}
              />
              {/* Outer glow ring when selected */}
              {isSelected && (
                <Circle cx={cx} cy={cy} r={DOT_R + 5} fill={isPositive ? '#6C63FF' + '20' : '#EF4444' + '20'} />
              )}
              {/* White ring border */}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? DOT_R + 1 : DOT_R}
                fill={isDark ? colors.background.primary : '#FFF'}
              />
              {/* Colored inner dot */}
              <Circle
                cx={cx}
                cy={cy}
                r={isSelected ? DOT_R - 1 : DOT_R - 2}
                fill={isPositive ? '#6C63FF' : '#EF4444'}
              />
            </G>
          );
        })}
      </Svg>

      {/* Labels */}
      <View style={s.trendLabels}>
        {points.map((pt, i) => {
          const isSelected = selectedIdx === i;
          return (
            <AppText
              key={i}
              style={[
                s.barLabel,
                {
                  color: isSelected ? colors.text.primary : colors.text.tertiary,
                  fontWeight: isSelected ? '800' : '600',
                  flex: 1,
                  textAlign: 'center',
                },
              ]}
            >
              {pt.label}
            </AppText>
          );
        })}
      </View>
    </View>
  );
}

/** Mini donut chart using border-based ring segments */
function MiniDonut({ slices, size }: { slices: CategorySlice[]; size: number }) {
  const { colors } = useTheme();
  const strokeWidth = 10;

  // Build rotation offsets
  let accumulated = 0;
  const segments = slices.map((sl) => {
    const rotation = (accumulated / 100) * 360 - 90;
    accumulated += sl.percentage;
    return { ...sl, rotation };
  });

  // Fallback: simple stacked ring using View borders
  // Since RN doesn't have SVG by default, we'll use a simpler visual
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.glass.backgroundMid,
          position: 'absolute',
        }}
      />
      {/* Overlay colored arcs (approximation using rotated half-circles) */}
      {segments.slice(0, 4).map((seg, i) => (
        <View
          key={seg.id}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: seg.color,
            borderRightColor: seg.percentage > 25 ? seg.color : 'transparent',
            transform: [{ rotate: `${seg.rotation}deg` }],
          }}
        />
      ))}
      {/* Center label */}
      <AppText style={{ fontSize: 14, fontWeight: '800', color: colors.text.primary }}>
        {slices.length}
      </AppText>
      <AppText style={{ fontSize: 8, fontWeight: '600', color: colors.text.tertiary }}>
        categories
      </AppText>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['5'], gap: Spacing['3'] },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    marginBottom: Spacing['1'],
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Period pills */
  periodRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
    marginBottom: Spacing['1'],
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },

  /* Hero card */
  heroCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing['4'],
    gap: Spacing['3'],
  },
  heroStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  heroAmount: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroNetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  heroStatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  heroStatVal: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  heroStatDivider: {
    width: 1,
    height: 32,
  },

  /* Section title */
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingLeft: 4,
    marginTop: Spacing['2'],
  },

  /* Growth cards */
  growthRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
  growthCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing['3'],
    gap: 3,
  },
  growthAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  growthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },

  /* Chart card */
  chartCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing['4'],
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['3'],
  },
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing['4'],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  expandBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Bar chart */
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
  barGroup: {
    alignItems: 'center',
    gap: 6,
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

  /* Tooltip */
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

  /* Trend line */
  trendLabels: {
    flexDirection: 'row',
    marginTop: 8,
  },

  /* Category breakdown */
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['4'],
    padding: Spacing['4'],
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
  },
  catIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catListSub: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  /* Budget */
  budgetCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing['4'],
    gap: Spacing['3'],
  },
  budgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Loans & Ledger */
  llRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
  llCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing['3'],
    gap: Spacing['2'],
    alignItems: 'center',
  },
  llAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  llIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  llStatRow: {
    flexDirection: 'row',
    gap: Spacing['4'],
  },
  llOverdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },

  /* Insights */
  insightsGrid: {
    gap: Spacing['2'],
  },
  insightCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing['4'],
    gap: Spacing['2'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing['2'],
  },
  insightText: {
    flex: 1,
    gap: 2,
  },
});
