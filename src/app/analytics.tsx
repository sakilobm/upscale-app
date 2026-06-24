/**
 * @file analytics.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Refactored analytics screen view shell. Feeds metrics, trends, and charts
 *   data from `useAnalyticsScreen` into modular, atomic presentation components.
 *   Zero headless states, zero inline chart calculations, zero inline formatting functions.
 * @associatedFiles src/features/analytics/hooks/useAnalyticsScreen.ts,
 *   src/components/analytics/ (all components)
 */

import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius, FontFamily } from '@constants/index';
import { useAnalyticsScreen } from '@features/analytics/hooks/useAnalyticsScreen';

// Modular Atomic Components
import { SectionTitle } from '@components/analytics/SectionTitle';
import { GrowthCard } from '@components/analytics/GrowthCard';
import { CashFlowChart } from '@components/analytics/CashFlowChart';
import { TrendLineChart } from '@components/analytics/TrendLineChart';
import { MiniDonut } from '@components/analytics/MiniDonut';
import { FullscreenChart } from '@components/analytics/FullscreenChart';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PERIODS = [
  { key: 'weekly',  label: 'Week',  icon: 'calendar-outline' },
  { key: 'monthly', label: 'Month', icon: 'today-outline' },
  { key: 'yearly',  label: 'Year',  icon: 'albums-outline' },
] as const;

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const analytics = useAnalyticsScreen();

  const cardBg       = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <View style={[s.root, { backgroundColor: colors.background.primary }]}>      
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header bar */}
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

        {/* Period Pills Selector */}
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
                <AppText style={{ fontSize: 12, fontWeight: '700', color: active ? '#FFF' : colors.text.secondary }}>
                  {p.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* Overview Summary */}
        <View style={[s.heroCard, { borderColor: colors.brand.primary + '22' }]}>
          <LinearGradient
            colors={isDark ? ['rgba(108,99,255,0.12)', 'rgba(56,189,248,0.06)'] : ['rgba(108,99,255,0.08)', 'rgba(56,189,248,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
                {analytics.formatFull(analytics.totalBalance)}
              </AppText>
            </View>
            <View style={[s.heroNetBadge, { backgroundColor: analytics.currentAgg.net >= 0 ? '#10B98118' : '#EF444418' }]}>
              <Ionicons
                name={analytics.currentAgg.net >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={analytics.currentAgg.net >= 0 ? '#10B981' : '#EF4444'}
              />
              <AppText style={{ fontSize: 11, fontWeight: '800', color: analytics.currentAgg.net >= 0 ? '#10B981' : '#EF4444' }}>
                {analytics.currentAgg.net >= 0 ? '+' : ''}{analytics.formatAmount(analytics.currentAgg.net)}
              </AppText>
            </View>
          </View>

          {/* Quick stat breakdowns */}
          <View style={s.heroStatsRow}>
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#10B981' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Income</AppText>
              <AppText style={[s.heroStatVal, { color: '#10B981' }]}>{analytics.formatAmount(analytics.currentAgg.income)}</AppText>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: dividerColor }]} />
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#EF4444' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Expenses</AppText>
              <AppText style={[s.heroStatVal, { color: '#EF4444' }]}>{analytics.formatAmount(analytics.currentAgg.expense)}</AppText>
            </View>
            <View style={[s.heroStatDivider, { backgroundColor: dividerColor }]} />
            <View style={s.heroStat}>
              <View style={[s.heroStatDot, { backgroundColor: '#6C63FF' }]} />
              <AppText variant="caption" color={colors.text.tertiary}>Saved</AppText>
              <AppText style={[s.heroStatVal, { color: '#6C63FF' }]}>{analytics.formatAmount(analytics.currentAgg.net)}</AppText>
            </View>
          </View>
        </View>

        {/* Growth Metrics Row */}
        <SectionTitle title="GROWTH METRICS" />
        <View style={s.growthRow}>
          {analytics.growthMetrics.map((m) => (
            <GrowthCard key={m.label} metric={m} cardBg={cardBg} colors={colors} formatAmount={analytics.formatAmount} />
          ))}
        </View>

        {/* Cash Flow Section */}
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
              onPress={() => { Haptics.selectionAsync(); analytics.setFullscreenChart('cashflow'); }}
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
            formatAmount={analytics.formatAmount}
            chartHeight={140}
          />
        </View>

        {/* Savings Trend Section */}
        <SectionTitle title="SAVINGS TREND" />
        <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          <View style={s.chartHeader}>
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '600', letterSpacing: 0.4 }}>
              Net savings per period
            </AppText>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); analytics.setFullscreenChart('trend'); }}
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
            formatAmount={analytics.formatAmount}
            chartHeight={100}
            chartWidth={SCREEN_W - 80}
          />
        </View>

        {/* Category Expense Breakdown */}
        {analytics.categoryBreakdown.length > 0 && (
          <>
            <SectionTitle title="EXPENSE BREAKDOWN" />
            <View style={[s.chartCard, { backgroundColor: cardBg, borderColor: colors.glass.border, padding: 0 }]}>
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

              {/* Detail category progress list */}
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
                        {analytics.formatAmount(cat.amount)}
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

        {/* Budget Health overview */}
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
                    {analytics.formatAmount(analytics.budgetUtilization.totalSpent)} of {analytics.formatAmount(analytics.budgetUtilization.totalLimit)}
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

        {/* Loans & Ledger Overviews */}
        {(analytics.loanSummary.borrowedCount + analytics.loanSummary.lentCount > 0 ||
          analytics.ledgerSummary.activeEntries > 0) && (
          <>
            <SectionTitle title="LOANS & LEDGER" />
            <View style={s.llRow}>
              {/* Loans Summary */}
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
                        {analytics.formatAmount(analytics.loanSummary.activeBorrowed)}
                      </AppText>
                    </View>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>Lent</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
                        {analytics.formatAmount(analytics.loanSummary.activeLent)}
                      </AppText>
                    </View>
                  </View>
                  {analytics.loanSummary.monthlyEmi > 0 && (
                    <AppText variant="caption" color={colors.text.tertiary}>
                      Monthly EMI: <AppText style={{ color: colors.text.primary, fontWeight: '700', fontSize: 11 }}>{analytics.formatAmount(analytics.loanSummary.monthlyEmi)}</AppText>
                    </AppText>
                  )}
                </View>
              )}

              {/* Ledger Summary */}
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
                        {analytics.formatAmount(analytics.ledgerSummary.totalOwedToMe)}
                      </AppText>
                    </View>
                    <View>
                      <AppText variant="caption" color={colors.text.tertiary}>I owe</AppText>
                      <AppText style={{ fontSize: 14, fontWeight: '800', color: '#EF4444' }}>
                        {analytics.formatAmount(analytics.ledgerSummary.totalIOwe)}
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

        {/* Smart financial insight alerts */}
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

      {/* Expanded Chart Modal: Cash Flow */}
      <FullscreenChart
        visible={analytics.fullscreenChart === 'cashflow'}
        onClose={() => analytics.setFullscreenChart(null)}
        title="Cash Flow"
      >
        <CashFlowChart
          bars={analytics.cashFlowBars}
          colors={colors}
          isDark={isDark}
          formatAmount={analytics.formatAmount}
          chartHeight={SCREEN_H * 0.55}
          isFullscreen
        />
      </FullscreenChart>

      {/* Expanded Chart Modal: Savings Trend */}
      <FullscreenChart
        visible={analytics.fullscreenChart === 'trend'}
        onClose={() => analytics.setFullscreenChart(null)}
        title="Savings Trend"
      >
        <TrendLineChart
          points={analytics.savingsTrend}
          colors={colors}
          isDark={isDark}
          formatAmount={analytics.formatAmount}
          chartHeight={SCREEN_H * 0.5}
          chartWidth={SCREEN_W - 40}
          isFullscreen
        />
      </FullscreenChart>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['5'], gap: Spacing['3'] },
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
  growthRow: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
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
