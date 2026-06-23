/**
 * @file analytics.tsx
 * @architecture Presentation Layer — Screen (View Shell)
 * @description Full-fledged advanced analytics screen with period-switchable
 *   (weekly/monthly/yearly) financial analysis. Features cash-flow bar charts,
 *   savings trend lines, category donut breakdowns, growth metrics, budget health,
 *   loan & ledger summaries, and AI-powered smart insight cards.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
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

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Period pill colors ──────────────────────────────────────────────────────
const PERIODS: { key: PeriodMode; label: string; icon: string }[] = [
  { key: 'weekly',  label: 'Week',  icon: 'calendar-outline' },
  { key: 'monthly', label: 'Month', icon: 'today-outline' },
  { key: 'yearly',  label: 'Year',  icon: 'albums-outline' },
];

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { symbol } = useFormatCurrency();
  const analytics = useAnalyticsScreen();

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
          <CashFlowChart bars={analytics.cashFlowBars} colors={colors} isDark={isDark} />
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SAVINGS TREND LINE
           ══════════════════════════════════════════════════════════════════ */}
        <SectionTitle title="SAVINGS TREND" />
        <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          <TrendLine points={analytics.savingsTrend} colors={colors} isDark={isDark} />
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

/** Custom bar chart built with Views */
function CashFlowChart({
  bars,
  colors,
  isDark,
}: {
  bars: CashFlowBar[];
  colors: any;
  isDark: boolean;
}) {
  const maxVal = Math.max(...bars.map((b) => Math.max(b.income, b.expense)), 1);
  const CHART_H = 120;
  const barWidth = Math.min(24, (SCREEN_W - 80) / bars.length / 2.5);

  return (
    <View style={s.barChartContainer}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((pct) => (
        <View
          key={pct}
          style={[
            s.gridLine,
            { bottom: pct * CHART_H, backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
          ]}
        />
      ))}

      <View style={[s.barChartRow, { height: CHART_H }]}>
        {bars.map((bar, i) => (
          <View key={i} style={s.barGroup}>
            <View style={s.barPair}>
              {/* Income bar */}
              <View
                style={[
                  s.bar,
                  {
                    height: Math.max((bar.income / maxVal) * CHART_H, 2),
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
                    height: Math.max((bar.expense / maxVal) * CHART_H, 2),
                    width: barWidth,
                    backgroundColor: '#EF4444',
                    borderRadius: barWidth / 2,
                  },
                ]}
              />
            </View>
            <AppText style={[s.barLabel, { color: colors.text.tertiary }]}>{bar.label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Custom trend line built with absolute-positioned dots and connectors */
function TrendLine({
  points,
  colors,
  isDark,
}: {
  points: { label: string; value: number }[];
  colors: any;
  isDark: boolean;
}) {
  const CHART_H = 80;
  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 1);
  const range = maxVal - minVal || 1;

  const getY = (v: number) => CHART_H - ((v - minVal) / range) * CHART_H;

  if (points.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="caption" color={colors.text.tertiary}>Not enough data for trend</AppText>
      </View>
    );
  }

  const segWidth = (SCREEN_W - 80) / (points.length - 1);

  return (
    <View>
      {/* Zero line */}
      {minVal < 0 && (
        <View
          style={[
            s.zeroLine,
            {
              top: getY(0),
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        />
      )}

      <View style={[s.trendContainer, { height: CHART_H }]}>
        {points.map((pt, i) => {
          const x = i * segWidth;
          const y = getY(pt.value);
          const isPositive = pt.value >= 0;

          return (
            <React.Fragment key={i}>
              {/* Connector line to next point */}
              {i < points.length - 1 && (() => {
                const nx = (i + 1) * segWidth;
                const ny = getY(points[i + 1].value);
                const dx = nx - x;
                const dy = ny - y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                  <View
                    style={{
                      position: 'absolute',
                      left: x + 4,
                      top: y + 3,
                      width: length,
                      height: 2,
                      backgroundColor: '#6C63FF',
                      borderRadius: 1,
                      transform: [{ rotate: `${angle}deg` }],
                      transformOrigin: 'left center',
                      opacity: 0.6,
                    }}
                  />
                );
              })()}

              {/* Dot */}
              <View
                style={[
                  s.trendDot,
                  {
                    left: x,
                    top: y,
                    backgroundColor: isPositive ? '#6C63FF' : '#EF4444',
                    borderColor: isDark ? colors.background.primary : '#FFF',
                  },
                ]}
              />
            </React.Fragment>
          );
        })}
      </View>

      {/* Labels */}
      <View style={s.trendLabels}>
        {points.map((pt, i) => (
          <AppText key={i} style={[s.barLabel, { color: colors.text.tertiary, width: segWidth, textAlign: 'center' }]}>
            {pt.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

/** Mini donut chart using border-based ring segments */
function MiniDonut({ slices, size }: { slices: CategorySlice[]; size: number }) {
  const { colors } = useTheme();
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build rotation offsets
  let accumulated = 0;
  const segments = slices.map((sl) => {
    const len = (sl.percentage / 100) * circumference;
    const rotation = (accumulated / 100) * 360 - 90;
    accumulated += sl.percentage;
    return { ...sl, len, gap: circumference - len, rotation };
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
  chartLegend: {
    flexDirection: 'row',
    gap: Spacing['4'],
    marginBottom: Spacing['3'],
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

  /* Trend line */
  trendContainer: {
    position: 'relative',
    marginHorizontal: 4,
  },
  trendDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    marginLeft: -4,
    marginTop: -4,
  },
  trendLabels: {
    flexDirection: 'row',
    marginTop: 8,
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
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
