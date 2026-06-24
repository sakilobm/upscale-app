/**
 * @file transactions.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Activity / Transactions screen. Pure declarative orchestrator: reads a
 *   single contract from useActivityScreen and renders extracted components. Zero
 *   business logic, zero raw useState, zero store imports.
 * @associatedFiles src/features/transactions/hooks/useActivityScreen.ts,
 *   src/components/activity/ (ActivityHero, AccountBar, ActivityEmptyState, SwipeableTransactionRow)
 */

import { View, FlatList, StyleSheet, RefreshControl, TextInput, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivityScreen } from '@features/transactions/hooks/useActivityScreen';
import { ActivityHero } from '@components/activity/ActivityHero';
import { AccountBar } from '@components/activity/AccountBar';
import { ActivityEmptyState } from '@components/activity/ActivityEmptyState';
import { SwipeableTransactionRow } from '@components/activity/SwipeableTransactionRow';
import { FilterBar } from '@features/transactions/components/FilterBar';
import { CategoryFilterBar } from '@features/transactions/components/CategoryFilterBar';
import { EditTransactionSheet } from '@components/transactions/EditTransactionSheet';
import { AppText } from '@components/AppText';
import { LoadingScreen } from '@components/LoadingScreen';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Layout, Radius, Typography } from '@constants/index';
import React, { useMemo, useCallback } from 'react';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const {
    groups, isLoading, isEmpty, refresh, removeTransaction, formatDateHeader,
    filters, setFilters, selectedAccount, summary, monthLabel, handleTransactionPress,
    editingTransaction, setEditingTransaction, runningBalances,
  } = useActivityScreen();

  const rawBalanceColor = selectedAccount?.color ?? colors.brand.primary;
  const isBrightColor   = !isDark && rawBalanceColor === colors.brand.primary;
  const balanceColor    = isBrightColor ? colors.text.brand : rawBalanceColor;
  const balanceIcon     = (selectedAccount?.icon ?? 'wallet-outline') as any;
  const cardBg          = isDark ? colors.background.secondary : colors.background.card;
  const cardBorder      = isDark ? colors.glass.border : colors.glass.borderStrong;
  const dividerColor    = isDark ? colors.glass.background : colors.glass.backgroundMid;

  const listData = useMemo(() => {
    const list: any[] = [
      { id: 'hero', type: 'hero' },
      { id: 'search', type: 'search' },
      { id: 'filters', type: 'filters' }
    ];
    if (isEmpty) {
      list.push({ id: 'empty', type: 'empty' });
    } else {
      (groups ?? []).forEach((group, idx) => {
        list.push({
          id: group.date,
          type: 'group',
          group,
          index: idx
        });
      });
    }
    return list;
  }, [groups, isEmpty]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (item.type) {
      case 'hero':
        return <ActivityHero summary={summary} monthLabel={monthLabel} />;
      case 'search':
        return (
          <View style={s.searchOuter}>
            <View style={[s.searchBox, { backgroundColor: isDark ? colors.background.secondary : colors.background.card, borderColor: cardBorder, shadowColor: colors.black }]}>
              <Ionicons name="search-outline" size={17} color={colors.text.tertiary} />
              <TextInput
                style={[s.searchInput, { ...Typography.bodyMD, lineHeight: undefined, color: colors.text.primary }]}
                placeholder="Search transactions..."
                placeholderTextColor={colors.text.tertiary}
                value={filters.searchQuery}
                onChangeText={(t) => setFilters({ searchQuery: t })}
                returnKeyType="search"
              />
              {!!filters.searchQuery && (
                <Ionicons name="close-circle" size={16} color={colors.text.tertiary} onPress={() => setFilters({ searchQuery: '' })} />
              )}
            </View>
          </View>
        );
      case 'filters':
        return (
          <View style={[s.stickyHeaderContainer, { backgroundColor: colors.background.primary }]}>
            <AccountBar />
            <FilterBar activeType={filters.type} onTypeChange={(type) => setFilters({ type })} />
            <CategoryFilterBar />
            {!isEmpty && (
              <View style={[s.tipContainer, { backgroundColor: isDark ? colors.glass.background : colors.brand.primary + '06', borderColor: isDark ? colors.glass.border : colors.brand.primary + '18' }]}>
                <Ionicons name="bulb-outline" size={14} color={colors.brand.primary} />
                <AppText variant="caption" color={colors.text.secondary} style={s.tipText}>
                  Swipe left on a transaction to delete
                </AppText>
              </View>
            )}
            <View style={[s.dividerLine, { backgroundColor: isDark ? colors.glass.border : colors.glass.borderStrong }]} />
          </View>
        );
      case 'empty':
        return (
          <View style={s.emptyStateContainer}>
            <ActivityEmptyState />
          </View>
        );
      case 'group': {
        const { group, index: groupIdx } = item;
        return (
          <View style={s.list}>
            <Animated.View
              style={s.section}
              entering={FadeInDown.springify().damping(22).stiffness(150).delay(groupIdx * 45)}
            >
              {/* Date header row */}
              <View style={s.dateHeader}>
                <View style={s.dateLabelRow}>
                  <View style={[s.dateDot, { backgroundColor: balanceColor }]} />
                  <AppText style={[s.dateText, { color: colors.text.secondary }]}>
                    {formatDateHeader(group.date)}
                  </AppText>
                </View>
                <View style={[s.balancePill, { backgroundColor: balanceColor + '0C', borderColor: balanceColor + '28' }]}>
                  <Ionicons name={balanceIcon} size={10} color={balanceColor} />
                  <AppText style={{ color: balanceColor, fontWeight: '700', fontSize: 10.5 }}>
                    {symbol}{group.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </AppText>
                </View>
              </View>

              {/* Transaction card */}
              <View style={[s.groupCard, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: colors.black }]}>
                {group.transactions.map((tx: any, idx: number) => (
                  <View key={tx.id}>
                    <SwipeableTransactionRow
                      tx={tx}
                      onPress={handleTransactionPress}
                      onDelete={async () => { try { await removeTransaction(tx.id); } catch { /* no-op */ } }}
                      balanceAfter={runningBalances.get(tx.id)}
                    />
                    {idx < group.transactions.length - 1 && (
                      <View style={[s.rowDivider, { backgroundColor: dividerColor }]} />
                    )}
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        );
      }
      default:
        return null;
    }
  }, [
    colors,
    isDark,
    filters,
    selectedAccount,
    isEmpty,
    runningBalances,
    symbol,
    cardBg,
    cardBorder,
    dividerColor,
    balanceColor,
    balanceIcon,
    handleTransactionPress,
    removeTransaction,
    setFilters,
    formatDateHeader,
    summary,
    monthLabel,
  ]);

  if (isLoading && !groups) return <LoadingScreen message="Loading transactions..." />;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.scrollContainer}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand.primary} />}
        removeClippedSubviews={Platform.OS === 'android'}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        updateCellsBatchingPeriod={50}
      />

      <EditTransactionSheet
        visible={!!editingTransaction}
        transaction={editingTransaction}
        onClose={() => setEditingTransaction(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },

  scrollContainer: {
    paddingTop: Spacing['1'],
    paddingBottom: Layout.tabBarHeight + Spacing['8'],
  },

  /* ── Search ── */
  searchOuter: {
    paddingHorizontal: Spacing['5'],
    marginTop: Spacing['4'],
    marginBottom: Spacing['2'],
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['2'],
    paddingHorizontal: Spacing['4'], height: 46, borderRadius: Radius.lg, borderWidth: 1,
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  searchInput: { flex: 1, paddingVertical: 0 },

  /* ── Sticky header ── */
  stickyHeaderContainer: {
    paddingTop: Spacing['2'],
    paddingBottom: Spacing['4'],
    gap: Spacing['3'],
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    paddingVertical: 10,
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing['5'],
    marginTop: Spacing['2'],
    marginBottom: Spacing['1'],
  },
  tipText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dividerLine: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing['5'] },

  /* ── Transaction list ── */
  list:    { paddingHorizontal: Spacing['5'], paddingTop: Spacing['3'], gap: Spacing['5'] },
  section: { gap: Spacing['2'] },

  dateHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['1'] },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dateDot:      { width: 5, height: 5, borderRadius: 2.5 },
  dateText:     { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1,
  },

  groupCard: {
    borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing['4'] },

  emptyStateContainer: {
    paddingTop: Spacing['8'],
    paddingHorizontal: Spacing['5'],
  },
});
