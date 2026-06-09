import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@features/transactions/hooks/useTransactions';
import { TransactionListItem } from '@features/transactions/components/TransactionListItem';
import { FilterBar } from '@features/transactions/components/FilterBar';
import { AppText } from '@components/AppText';
import { AppHeader } from '@components/AppHeader';
import { EmptyState } from '@components/EmptyState';
import { LoadingScreen } from '@components/LoadingScreen';
import { Spacing, Layout, Radius, Typography } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useTransactionStore } from '@store/transactionStore';
import type { Transaction } from '@store/types';

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const {
    data: groups,
    isLoading,
    isError,
    isEmpty,
    refresh,
    removeTransaction,
    formatDateHeader,
  } = useTransactions();

  const filters = useTransactionStore((s) => s.filters);
  const setFilters = useTransactionStore((s) => s.setFilters);

  const handleTransactionPress = useCallback((_tx: Transaction) => {}, []);
  const handleLongPress = useCallback(
    async (tx: Transaction) => {
      try { await removeTransaction(tx.id); } catch { /* no-op */ }
    },
    [removeTransaction]
  );

  if (isLoading && !groups) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  const cardBg      = isDark ? colors.background.secondary : '#FFFFFF';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <AppHeader title="Activity" subtitle="All your transactions" />

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: cardBg,
              borderColor:     cardBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { ...Typography.bodyMD, color: colors.text.primary }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.text.tertiary}
            value={filters.searchQuery}
            onChangeText={(text) => setFilters({ searchQuery: text })}
            returnKeyType="search"
          />
          {!!filters.searchQuery && (
            <Ionicons
              name="close-circle"
              size={16}
              color={colors.text.tertiary}
              onPress={() => setFilters({ searchQuery: '' })}
            />
          )}
        </View>
      </View>

      <FilterBar
        activeType={filters.type}
        onTypeChange={(type) => setFilters({ type })}
      />

      {isEmpty ? (
        <EmptyState
          emoji="📭"
          title="No transactions"
          subtitle="Add your first income or expense to get started."
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={colors.brand.primary}
            />
          }
        >
          {(groups ?? []).map((group) => (
            <View key={group.date} style={styles.section}>
              {/* Date header */}
              <View style={styles.sectionHeader}>
                <AppText variant="labelMD" color={colors.text.secondary}>
                  {formatDateHeader(group.date)}
                </AppText>
                <AppText
                  variant="labelMD"
                  color={group.totalAmount >= 0 ? colors.status.income : colors.status.expense}
                >
                  {group.totalAmount >= 0 ? '+' : '-'}${Math.abs(group.totalAmount).toFixed(2)}
                </AppText>
              </View>

              {/* Grouped card */}
              <View
                style={[
                  styles.groupCard,
                  {
                    backgroundColor: cardBg,
                    borderColor:     cardBorder,
                  },
                ]}
              >
                {group.transactions.map((tx, idx) => (
                  <View key={tx.id}>
                    <TransactionListItem
                      transaction={tx}
                      onPress={handleTransactionPress}
                      onLongPress={handleLongPress}
                    />
                    {idx < group.transactions.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchWrapper: {
    paddingHorizontal: Spacing['5'],
    marginBottom:      Spacing['2'],
  },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing['2'],
    paddingHorizontal: Spacing['4'],
    height:            46,
    borderRadius:      Radius.lg,
    borderWidth:       1,
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius:  6,
      },
      android: { elevation: 1 },
    }),
  },
  searchInput: {
    flex:   1,
    height: 46,
  },
  listContent: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['2'],
    gap:               Spacing['4'],
  },
  section: {
    gap: Spacing['2'],
  },
  sectionHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: Spacing['1'],
  },
  groupCard: {
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius:  10,
      },
      android: { elevation: 2 },
    }),
  },
  divider: {
    height:           StyleSheet.hairlineWidth,
    marginHorizontal: Spacing['4'],
  },
});
