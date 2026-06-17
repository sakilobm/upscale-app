/**
 * @file transactions.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Activity / Transactions screen. Pure declarative orchestrator: reads a
 *   single contract from useActivityScreen and renders extracted components. Zero
 *   business logic, zero raw useState, zero store imports.
 * @associatedFiles src/features/transactions/hooks/useActivityScreen.ts,
 *   src/components/activity/ (ActivityHero, AccountBar, ActivityEmptyState, SwipeableTransactionRow)
 */

import { View, ScrollView, StyleSheet, RefreshControl, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivityScreen } from '@features/transactions/hooks/useActivityScreen';
import { ActivityHero } from '@components/activity/ActivityHero';
import { AccountBar } from '@components/activity/AccountBar';
import { ActivityEmptyState } from '@components/activity/ActivityEmptyState';
import { SwipeableTransactionRow } from '@components/activity/SwipeableTransactionRow';
import { FilterBar } from '@features/transactions/components/FilterBar';
import { AppText } from '@components/AppText';
import { LoadingScreen } from '@components/LoadingScreen';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { Spacing, Layout, Radius, Typography } from '@constants/index';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const { symbol } = useFormatCurrency();
  const {
    groups, isLoading, isEmpty, refresh, removeTransaction, formatDateHeader,
    filters, setFilters, selectedAccount, summary, monthLabel, handleTransactionPress,
  } = useActivityScreen();

  const rawBalanceColor = selectedAccount?.color ?? colors.brand.primary;
  const isBrightColor = !isDark && rawBalanceColor === colors.brand.primary;
  const balanceColor = isBrightColor ? colors.text.brand : rawBalanceColor;
  const balanceIcon = (selectedAccount?.icon ?? 'wallet-outline') as any;
  const cardBg = isDark ? colors.background.secondary : colors.background.card;
  const cardBorder = isDark ? colors.glass.border : colors.glass.borderStrong;
  const dividerColor = isDark ? colors.glass.background : colors.glass.background;

  if (isLoading && !groups) return <LoadingScreen message="Loading transactions..." />;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <View style={s.topArea}>
        <ActivityHero summary={summary} monthLabel={monthLabel} />

        <View style={s.searchOuter}>
          <View style={[s.searchBox, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: colors.black }]}>
            <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
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

        <AccountBar />
        <FilterBar activeType={filters.type} onTypeChange={(type) => setFilters({ type })} />
        <View style={[s.dividerLine, { backgroundColor: colors.glass.background }]} />
      </View>

      {isEmpty ? (
        <ScrollView contentContainerStyle={{ paddingTop: Spacing['4'], paddingBottom: Layout.tabBarHeight + Spacing['8'] }} showsVerticalScrollIndicator={false}>
          <ActivityEmptyState />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[s.list, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand.primary} />}
        >
          {(groups ?? []).map((group) => (
            <View key={group.date} style={s.section}>
              <View style={s.dateHeader}>
                <AppText variant="labelMD" color={colors.text.secondary}>{formatDateHeader(group.date)}</AppText>
                <View style={[s.balancePill, { backgroundColor: balanceColor + '16' }]}>
                  <Ionicons name={balanceIcon} size={12} color={balanceColor} />
                  <AppText variant="labelSM" style={{ color: balanceColor, fontWeight: '600', fontSize: 12 }}>
                    {symbol}{group.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </AppText>
                </View>
              </View>

              <View style={[s.groupCard, { backgroundColor: cardBg, borderColor: cardBorder, shadowColor: colors.black }]}>
                {group.transactions.map((tx, idx) => (
                  <View key={tx.id}>
                    <SwipeableTransactionRow
                      tx={tx}
                      onPress={handleTransactionPress}
                      onDelete={async () => { try { await removeTransaction(tx.id); } catch { /* no-op */ } }}
                    />
                    {idx < group.transactions.length - 1 && (
                      <View style={[s.rowDivider, { backgroundColor: dividerColor }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topArea: { gap: Spacing['4'], paddingBottom: Spacing['2'] },

  searchOuter: { paddingHorizontal: Spacing['5'] },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['2'],
    paddingHorizontal: Spacing['4'], height: 46, borderRadius: Radius.lg, borderWidth: 1,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  searchInput: { flex: 1, paddingVertical: 0 },

  dividerLine: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing['5'] },

  list: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'], gap: Spacing['4'] },
  section: { gap: Spacing['2'] },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['1'] },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  groupCard: {
    borderRadius: Radius.xl, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  rowDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing['4'] },
});
