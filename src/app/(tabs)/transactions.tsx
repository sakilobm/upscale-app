import React, { useCallback } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@features/transactions/hooks/useTransactions';
import { TransactionListItem } from '@features/transactions/components/TransactionListItem';
import { FilterBar } from '@features/transactions/components/FilterBar';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { LoadingScreen } from '@components/LoadingScreen';
import { Spacing, Layout, Radius, Typography } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useTransactionStore } from '@store/transactionStore';
import type { Transaction } from '@store/types';

export default function TransactionsScreen() {
  const { colors } = useTheme();
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

  const sections =
    groups?.map((g) => ({
      title: g.date,
      totalAmount: g.totalAmount,
      data: g.transactions,
    })) ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="headingLG" color={colors.text.primary}>Transactions</AppText>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <GlassCard padding={0} style={styles.searchCard} borderRadius={Radius.lg}>
          <View style={styles.searchInner}>
            <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { ...Typography.bodyMD, color: colors.text.primary }]}
              placeholder="Search transactions..."
              placeholderTextColor={colors.text.tertiary}
              value={filters.searchQuery}
              onChangeText={(text) => setFilters({ searchQuery: text })}
              returnKeyType="search"
            />
          </View>
        </GlassCard>
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
              tintColor={colors.brand.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <AppText variant="labelMD" color={colors.text.secondary}>
                {formatDateHeader(section.title)}
              </AppText>
              <AppText
                variant="labelMD"
                color={section.totalAmount >= 0 ? colors.status.income : colors.status.expense}
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
  safeArea: { flex: 1 },
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
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    gap: Spacing['2'],
    height: 46,
  },
  searchInput: {
    flex: 1,
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
