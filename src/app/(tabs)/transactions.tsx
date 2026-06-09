import React, { useCallback } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTransactions } from '@features/transactions/hooks/useTransactions';
import { TransactionListItem } from '@features/transactions/components/TransactionListItem';
import { FilterBar } from '@features/transactions/components/FilterBar';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { LoadingScreen } from '@components/LoadingScreen';
import { Colors, Spacing, Layout, Radius, Typography } from '@constants/index';
import { useTransactionStore } from '@store/transactionStore';
import type { Transaction } from '@store/types';

const SCREEN_CONSTANTS = {
  title: 'Transactions',
  searchPlaceholder: 'Search transactions...',
  emptyTitle: 'No transactions',
  emptySubtitle: 'Add your first income or expense to get started.',
} as const;

export default function TransactionsScreen() {
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

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    // Future: navigate to detail modal
  }, []);

  const handleLongPress = useCallback(
    async (tx: Transaction) => {
      try {
        await removeTransaction(tx.id);
      } catch { /* swallow — UI feedback TBD */ }
    },
    [removeTransaction]
  );

  if (isLoading && !groups) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  const sections =
    groups?.map((g) => ({
      title: g.date,
      totalAmount: g.totalAmount,
      data: g.transactions,
    })) ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="headingLG">{SCREEN_CONSTANTS.title}</AppText>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrapper}>
        <GlassCard padding={0} style={styles.searchCard} borderRadius={Radius.lg}>
          <TextInput
            style={styles.searchInput}
            placeholder={SCREEN_CONSTANTS.searchPlaceholder}
            placeholderTextColor={Colors.text.tertiary}
            value={filters.searchQuery}
            onChangeText={(text) => setFilters({ searchQuery: text })}
            returnKeyType="search"
          />
        </GlassCard>
      </View>

      {/* Type filter */}
      <FilterBar
        activeType={filters.type}
        onTypeChange={(type) => setFilters({ type })}
      />

      {/* List */}
      {isEmpty ? (
        <EmptyState
          emoji="📭"
          title={SCREEN_CONSTANTS.emptyTitle}
          subtitle={SCREEN_CONSTANTS.emptySubtitle}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              tintColor={Colors.brand.secondary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <AppText variant="labelMD" color={Colors.text.secondary}>
                {formatDateHeader(section.title)}
              </AppText>
              <AppText
                variant="labelMD"
                color={
                  section.totalAmount >= 0
                    ? Colors.status.income
                    : Colors.status.expense
                }
              >
                {section.totalAmount >= 0 ? '+' : '-'}$
                {Math.abs(section.totalAmount).toFixed(2)}
              </AppText>
            </View>
          )}
          renderItem={({ item }) => (
            <TransactionListItem
              transaction={item}
              onPress={handleTransactionPress}
              onLongPress={handleLongPress}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    paddingBottom: Spacing['3'],
  },
  searchWrapper: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['3'],
  },
  searchCard: {
    borderRadius: Radius.lg,
  },
  searchInput: {
    ...Typography.bodyMD,
    color: Colors.text.primary,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    height: 46,
  },
  listContent: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['2'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing['3'],
    marginTop: Spacing['2'],
  },
});
