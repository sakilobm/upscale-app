import { useState, useCallback, type ComponentProps } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
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
import { useAccountStore } from '@store/accountStore';
import type { Account, Transaction } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Account chip ─────────────────────────────────────────────────────────────

interface ChipData {
  id:      string | null;
  name:    string;
  icon:    IoniconName;
  color:   string;
  balance: number;
}

function AccountChip({
  chip,
  isActive,
  onPress,
}: {
  chip:     ChipData;
  isActive: boolean;
  onPress:  () => void;
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.94, { damping: 14, stiffness: 320 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    });
    onPress();
  };

  const bg      = isActive ? chip.color + '1E' : (isDark ? '#FFFFFF0A' : '#F1F1F5');
  const border  = isActive ? chip.color + '55' : 'transparent';
  const nameClr = isActive ? chip.color : colors.text.secondary;
  const balClr  = isActive ? chip.color + 'BB' : colors.text.tertiary;

  return (
    <Pressable onPress={handlePress} style={styles.chipWrapper}>
      <Animated.View
        style={[
          styles.chip,
          animStyle,
          { backgroundColor: bg, borderColor: border, borderWidth: 1 },
        ]}
      >
        {/* Colored icon circle */}
        <View
          style={[
            styles.chipIcon,
            { backgroundColor: chip.color + (isActive ? '28' : '14') },
          ]}
        >
          <Ionicons name={chip.icon} size={17} color={chip.color} />
        </View>

        {/* Labels */}
        <View style={styles.chipLabels}>
          <AppText
            variant="labelSM"
            style={{ color: nameClr, fontWeight: isActive ? '700' : '500', lineHeight: 15 }}
            numberOfLines={1}
          >
            {chip.name}
          </AppText>
          <AppText
            style={{ color: balClr, fontSize: 11, lineHeight: 14 }}
            numberOfLines={1}
          >
            ${chip.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </AppText>
        </View>

        {/* Active bottom line */}
        {isActive && (
          <View style={[styles.chipActiveLine, { backgroundColor: chip.color }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Account bar ─────────────────────────────────────────────────────────────

function AccountBar({ onManagePress }: { onManagePress?: () => void }) {
  const accounts   = useAccountStore((s) => s.accounts);
  const filters    = useTransactionStore((s) => s.filters);
  const setFilters = useTransactionStore((s) => s.setFilters);
  const { colors } = useTheme();

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const allChip: ChipData = {
    id:      null,
    name:    'All',
    icon:    'wallet-outline',
    color:   colors.brand.primary,
    balance: totalBalance,
  };

  const chips: ChipData[] = [
    allChip,
    ...accounts.map((a) => ({
      id:      a.id,
      name:    a.name,
      icon:    a.icon as IoniconName,
      color:   a.color,
      balance: a.balance,
    })),
  ];

  return (
    <View style={styles.accountBarOuter}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.accountBarContent}
        style={styles.accountBarScroll}
      >
        {chips.map((chip) => (
          <AccountChip
            key={chip.id ?? 'all'}
            chip={chip}
            isActive={chip.id === filters.accountId}
            onPress={() => setFilters({ accountId: chip.id })}
          />
        ))}

        {/* Manage button → dedicated Accounts screen */}
        <Pressable
          onPress={() => router.push('/accounts')}
          style={({ pressed }) => [styles.manageBtn, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Ionicons name="settings-outline" size={14} color={colors.text.tertiary} />
          <AppText variant="labelSM" color={colors.text.tertiary} style={{ fontSize: 12 }}>
            Manage
          </AppText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const { colors, isDark } = useTheme();
  const {
    data: groups,
    isLoading,
    isEmpty,
    refresh,
    removeTransaction,
    formatDateHeader,
  } = useTransactions();

  const accounts   = useAccountStore((s) => s.accounts);
  const filters    = useTransactionStore((s) => s.filters);
  const setFilters = useTransactionStore((s) => s.setFilters);

  // Selected account info for colorful date-header balance
  const selectedAccount: Account | null = filters.accountId
    ? (accounts.find((a) => a.id === filters.accountId) ?? null)
    : null;
  const balanceColor = selectedAccount?.color ?? colors.brand.primary;
  const balanceIcon  = (selectedAccount?.icon ?? 'wallet-outline') as IoniconName;

  const handleTransactionPress = useCallback((_tx: Transaction) => {}, []);
  const handleLongPress = useCallback(
    async (tx: Transaction) => {
      try { await removeTransaction(tx.id); } catch { /* no-op */ }
    },
    [removeTransaction],
  );

  if (isLoading && !groups) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  const cardBg       = isDark ? colors.background.secondary : '#FFFFFF';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <AppHeader title="Activity" subtitle="All your transactions" />

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { ...Typography.bodyMD, color: colors.text.primary }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.text.tertiary}
            value={filters.searchQuery}
            onChangeText={(t) => setFilters({ searchQuery: t })}
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

      {/* Account filter bar */}
      <AccountBar />

      {/* Type filter */}
      <FilterBar
        activeType={filters.type}
        onTypeChange={(type) => setFilters({ type })}
      />

      {/* List */}
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
              {/* Date header — right shows per-account running balance */}
              <View style={styles.sectionHeader}>
                <AppText variant="labelMD" color={colors.text.secondary}>
                  {formatDateHeader(group.date)}
                </AppText>

                <View
                  style={[
                    styles.balancePill,
                    { backgroundColor: balanceColor + '16' },
                  ]}
                >
                  <Ionicons name={balanceIcon} size={12} color={balanceColor} />
                  <AppText
                    variant="labelSM"
                    style={{ color: balanceColor, fontWeight: '600', fontSize: 12 }}
                  >
                    ${group.balanceAfter.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </AppText>
                </View>
              </View>

              {/* Grouped card */}
              <View
                style={[styles.groupCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Search
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

  // Account bar
  accountBarOuter: {
    marginBottom: Spacing['2'],
  },
  accountBarScroll: {},
  accountBarContent: {
    paddingHorizontal: Spacing['5'],
    gap:               Spacing['2'],
    alignItems:        'center',
  },

  // Individual chip
  chipWrapper: {},
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               Spacing['2'],
    paddingLeft:       Spacing['2'],
    paddingRight:      Spacing['3'],
    paddingTop:        8,
    paddingBottom:     10,  // extra room for the active bottom line
    borderRadius:      Radius.xl,
    minWidth:          90,
    position:          'relative',
    overflow:          'hidden',
  },
  chipIcon: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  chipLabels: {
    flex:      1,
    minWidth:  60,
    gap:       1,
  },
  chipActiveLine: {
    position:     'absolute',
    bottom:       0,
    left:         0,
    right:        0,
    height:       2.5,
    borderRadius: 1.5,
  },

  // Manage button
  manageBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: Spacing['3'],
    paddingVertical:   Spacing['2'],
  },

  // Tx list
  listContent: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['2'],
    gap:               Spacing['4'],
  },
  section: {
    gap: Spacing['2'],
  },
  sectionHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: Spacing['1'],
  },
  balancePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      Radius.full,
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
