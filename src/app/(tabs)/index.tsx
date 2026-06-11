import { useState, useCallback, useMemo, useEffect, type ComponentProps } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { CATEGORY_META } from '@components/CategoryIcon';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@store/authStore';
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { toast } from '@store/toastStore';
import type { Transaction, TransactionCategory, TransactionType } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
const { height: SH } = Dimensions.get('window');

// ─── Category config per type ─────────────────────────────────────────────────

const EXPENSE_CATS: TransactionCategory[] = [
  'food', 'housing', 'transport', 'health', 'entertainment', 'shopping', 'education', 'other',
];
const INCOME_CATS: TransactionCategory[] = [
  'salary', 'freelance', 'gift', 'investment', 'savings', 'other',
];
const CAT_LABELS: Record<TransactionCategory, string> = {
  food: 'Food', housing: 'Home', transport: 'Travel', health: 'Health',
  entertainment: 'Fun', shopping: 'Shop', education: 'Study', savings: 'Save',
  investment: 'Invest', salary: 'Salary', freelance: 'Freelance', gift: 'Gift', other: 'Other',
};

// ─── Numpad ───────────────────────────────────────────────────────────────────

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'] as const;

function applyNumpad(current: string, key: string): string {
  if (key === '⌫') return current.length > 1 ? current.slice(0, -1) : '0';
  if (key === '.') return current.includes('.') ? current : current + '.';
  if (current === '0') return key;
  if (current.includes('.') && current.split('.')[1].length >= 2) return current;
  return current + key;
}

// ─── Quick Add Sheet ──────────────────────────────────────────────────────────

function QuickAddSheet({
  visible,
  initialType,
  onClose,
}: {
  visible: boolean;
  initialType: 'expense' | 'income';
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const accounts = useAccountStore((s) => s.accounts);
  const addAccount_updateBalance = useAccountStore((s) => s.updateAccount);
  const defaultAccount = accounts.find((a) => a.isDefault) ?? accounts[0] ?? null;

  const addTransaction = useTransactionStore((s) => s.addTransaction);

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [amountStr, setAmountStr] = useState('0');
  const [category, setCategory] = useState<TransactionCategory>('food');
  const [accountId, setAccountId] = useState(defaultAccount?.id ?? '');
  const [note, setNote] = useState('');

  const slideY = useSharedValue(SH * 0.9);

  useEffect(() => {
    if (visible) {
      setType(initialType);
      setAmountStr('0');
      setCategory(initialType === 'expense' ? 'food' : 'salary');
      setAccountId(defaultAccount?.id ?? accounts[0]?.id ?? '');
      setNote('');
      slideY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH * 0.9, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, initialType]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleSave = () => {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    const account = accounts.find((a) => a.id === accountId);
    if (!account) { toast.error('Select an account'); return; }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      userId: 'user-1',
      type,
      category,
      amount,
      currency: account.currency,
      description: note.trim() || CAT_LABELS[category],
      note: note.trim() || null,
      date: now,
      accountId,
      createdAt: now,
      updatedAt: now,
    };

    addTransaction(newTx);
    addAccount_updateBalance(accountId, {
      balance: type === 'income' ? account.balance + amount : account.balance - amount,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${type === 'expense' ? 'Expense' : 'Income'} added`);
    onClose();
  };

  const accentColor = type === 'expense' ? '#EF4444' : '#10B981';
  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const sheetBg = isDark ? '#131722' : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F3F4F6';

  const amountDisplay = parseFloat(amountStr || '0')
    .toLocaleString('en-US', { minimumFractionDigits: amountStr.includes('.') ? Math.min(amountStr.split('.')[1]?.length ?? 0, 2) : 0, maximumFractionDigits: 2 });

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.qaOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          style={[styles.qaSheet, { backgroundColor: sheetBg, paddingBottom: insets.bottom + 8 }, sheetStyle]}
        >
          {/* Handle */}
          <View style={styles.qaHandle} />

          {/* Type toggle */}
          <View style={[styles.qaTypeRow, { backgroundColor: isDark ? '#FFFFFF10' : '#00000009' }]}>
            {(['expense', 'income'] as const).map((t) => {
              const active = type === t;
              const tColor = t === 'expense' ? '#EF4444' : '#10B981';
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    setType(t);
                    setCategory(t === 'expense' ? 'food' : 'salary');
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.qaTypeBtn,
                    active && { backgroundColor: tColor + '1A', borderColor: tColor + '44', borderWidth: 1 },
                  ]}
                >
                  <Ionicons
                    name={t === 'expense' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                    size={18}
                    color={active ? tColor : colors.text.tertiary}
                  />
                  <AppText
                    variant="labelMD"
                    style={{
                      color: active ? tColor : colors.text.tertiary,
                      fontWeight: active ? '700' : '500',
                    }}
                  >
                    {t === 'expense' ? 'Expense' : 'Income'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Amount display */}
          <View style={styles.qaAmountSection}>
            <AppText style={[styles.qaAmountDisplay, { color: accentColor }]}>
              ${amountDisplay}
            </AppText>
            <AppText variant="caption" style={{ color: colors.text.tertiary }}>
              {accounts.find((a) => a.id === accountId)?.currency ?? 'USD'}
            </AppText>
          </View>

          {/* Numpad */}
          <View style={styles.qaNumpad}>
            {NUMPAD_KEYS.map((key) => {
              const isBackspace = key === '⌫';
              const isDot = key === '.';
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setAmountStr((prev) => applyNumpad(prev, key));
                    Haptics.selectionAsync();
                  }}
                  style={({ pressed }) => [
                    styles.qaNumKey,
                    {
                      backgroundColor: isBackspace
                        ? accentColor + '15'
                        : isDark ? '#FFFFFF0A' : '#F3F4F6',
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  {isBackspace ? (
                    <Ionicons name="backspace-outline" size={22} color={accentColor} />
                  ) : (
                    <AppText
                      style={[
                        styles.qaNumKeyText,
                        { color: isDot ? colors.text.secondary : colors.text.primary },
                      ]}
                    >
                      {key}
                    </AppText>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Category picker */}
          <AppText variant="labelSM" style={[styles.qaSectionLabel, { color: colors.text.tertiary }]}>
            CATEGORY
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.qaCatScroll}
          >
            {cats.map((cat) => {
              const meta = CATEGORY_META[cat];
              const active = category === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    setCategory(cat);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.qaCatChip,
                    {
                      backgroundColor: active ? meta.color + '20' : inputBg,
                      borderColor: active ? meta.color + '50' : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={[styles.qaCatIcon, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={15} color={meta.color} />
                  </View>
                  <AppText
                    variant="labelSM"
                    style={{
                      color: active ? meta.color : colors.text.secondary,
                      fontWeight: active ? '700' : '500',
                      fontSize: 11,
                    }}
                  >
                    {CAT_LABELS[cat]}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Account picker */}
          {accounts.length > 1 && (
            <>
              <AppText variant="labelSM" style={[styles.qaSectionLabel, { color: colors.text.tertiary }]}>
                ACCOUNT
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.qaAccountScroll}
              >
                {accounts.map((acc) => {
                  const active = accountId === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => setAccountId(acc.id)}
                      style={[
                        styles.qaAccountChip,
                        {
                          backgroundColor: active ? acc.color + '1A' : inputBg,
                          borderColor: active ? acc.color + '55' : 'transparent',
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <View style={[styles.qaAccountIcon, { backgroundColor: acc.color + '22' }]}>
                        <Ionicons name={acc.icon as IoniconName} size={14} color={acc.color} />
                      </View>
                      <AppText
                        variant="labelSM"
                        style={{
                          color: active ? acc.color : colors.text.secondary,
                          fontWeight: active ? '700' : '500',
                        }}
                      >
                        {acc.name}
                      </AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          {/* Note input */}
          <TextInput
            style={[
              styles.qaNoteInput,
              {
                backgroundColor: inputBg,
                color: colors.text.primary,
                borderColor: isDark ? '#FFFFFF10' : '#00000010',
              },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.text.tertiary}
            maxLength={80}
          />

          {/* Add button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.qaAddBtn,
              { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
            <AppText style={styles.qaAddBtnText}>
              Add {type === 'expense' ? 'Expense' : 'Income'}
            </AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { data, isLoading, isError, refresh } = useDashboardData();
  const user = useAuthStore((s) => s.user);

  const accounts = useAccountStore((s) => s.accounts);
  const storeTransactions = useTransactionStore((s) => s.transactions);

  const [addVisible, setAddVisible] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');

  // Live balance from store
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  // Live recent transactions (newest first, up to 5)
  const recentTransactions = useMemo(
    () => [...storeTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [storeTransactions],
  );

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    router.push('/(tabs)/transactions');
  }, []);

  const openAdd = (type: 'expense' | 'income') => {
    setAddType(type);
    setAddVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const quickActions: { icon: IoniconName; label: string; color?: string; action: () => void }[] = [
    { icon: 'remove-circle-outline', label: 'Expense', color: '#EF4444', action: () => openAdd('expense') },
    { icon: 'add-circle-outline',    label: 'Income',  color: '#10B981', action: () => openAdd('income') },
    { icon: 'shuffle-outline',        label: 'Split',                     action: () => toast.info('Split expenses — coming soon') },
    { icon: 'bar-chart-outline',      label: 'Activity',                  action: () => router.push('/(tabs)/transactions') },
  ];

  const firstName = user?.fullName?.split(' ')[0] ?? 'Sakil';
  const initials  = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'SK';

  if (isError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]}>
        <EmptyState emoji="⚠️" title="Something went wrong" subtitle="Pull down to retry" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && data !== null}
            onRefresh={refresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDark ? colors.brand.primary + '28' : colors.brand.primary,
                borderColor: isDark ? colors.brand.primary + '55' : 'transparent',
              },
            ]}
          >
            <AppText style={[styles.avatarText, { color: isDark ? colors.brand.primary : '#000000' }]}>
              {initials}
            </AppText>
          </View>

          <View style={styles.greetingBlock}>
            <AppText variant="caption" color={colors.text.tertiary}>Good day,</AppText>
            <AppText variant="headingSM" color={colors.text.primary} style={styles.greetingName}>
              {firstName} 👋
            </AppText>
          </View>

          <Pressable
            onPress={() => toast.info('No new notifications')}
            style={({ pressed }) => [
              styles.headerAction,
              {
                backgroundColor: isDark ? colors.glass.backgroundMid : '#FFFFFF',
                borderColor: isDark ? colors.glass.border : 'rgba(0,0,0,0.08)',
                opacity: pressed ? 0.65 : 1,
                ...Platform.select({
                  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0 : 0.07, shadowRadius: 6 },
                  android: { elevation: isDark ? 0 : 2 },
                }),
              },
            ]}
          >
            <Ionicons name="notifications-outline" size={19} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* ── Balance card label ──────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <AppText variant="labelMD" color={colors.text.secondary}>Your Card</AppText>
          <Pressable onPress={() => router.push('/accounts')}>
            <AppText variant="labelSM" color={colors.brand.accent}>Manage</AppText>
          </Pressable>
        </View>

        {/* ── Balance Card (live from store) ────────────────────── */}
        <BalanceCard
          totalBalance={totalBalance}
          monthSummary={data?.monthSummary ?? {
            month: '',
            totalIncome: 0,
            totalExpense: 0,
            netSavings: 0,
            transactionCount: 0,
          }}
          isLoading={isLoading && data === null}
        />

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          {quickActions.map(({ icon, label, color, action }, i) => {
            const isExpense = label === 'Expense';
            const isIncome  = label === 'Income';
            const isPrimary = isExpense || isIncome;
            const bgColor   = isPrimary ? (color! + (isDark ? '22' : '18')) : (isDark ? colors.glass.backgroundMid : '#FFFFFF');
            const iconColor = isPrimary ? color! : colors.text.primary;
            return (
              <Pressable
                key={label}
                onPress={action}
                style={({ pressed }) => [styles.actionItem, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    {
                      backgroundColor: bgColor,
                      borderWidth: isPrimary ? 1.5 : 1,
                      borderColor: isPrimary ? color! + '40' : (isDark ? colors.glass.border : 'rgba(0,0,0,0.08)'),
                      ...Platform.select({
                        ios: { shadowColor: isPrimary ? color : '#000', shadowOffset: { width: 0, height: isPrimary ? 4 : 2 }, shadowOpacity: isPrimary ? 0.25 : 0.06, shadowRadius: isPrimary ? 10 : 6 },
                        android: { elevation: isPrimary ? 4 : 2 },
                      }),
                    },
                  ]}
                >
                  <Ionicons name={icon} size={22} color={iconColor} />
                </View>
                <AppText variant="caption" color={colors.text.secondary} style={styles.actionLabel}>
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {/* ── This Month ───────────────────────────────────────────── */}
        {data && (
          <View style={styles.section}>
            <SectionTitle title="This Month" />
            <View style={styles.statsRow}>
              <QuickStatCard label="Income"   amount={data.monthSummary.totalIncome}  type="income"  iconEmoji="💰" />
              <QuickStatCard label="Expenses" amount={data.monthSummary.totalExpense} type="expense" iconEmoji="💸" />
            </View>
          </View>
        )}

        {/* ── Spending Chart ──────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionTitle title="Where it went" />
          <SpendingChart data={data?.spendingByCategory ?? []} isLoading={isLoading} />
        </View>

        {/* ── Recent Activity ─────────────────────────────────────── */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <SectionTitle
              title="Recent Activity"
              action="See all"
              onAction={() => router.push('/(tabs)/transactions')}
            />
            <GlassCard padding={0}>
              {recentTransactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[styles.txRow, idx === recentTransactions.length - 1 && styles.txRowLast]}
                >
                  <RecentTransactionRow transaction={tx} onPress={handleTransactionPress} />
                </View>
              ))}
            </GlassCard>
          </View>
        )}
      </ScrollView>

      {/* Quick Add Sheet */}
      <QuickAddSheet
        visible={addVisible}
        initialType={addType}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

function SectionTitle({
  title, action, onAction,
}: {
  title: string; action?: string; onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <AppText variant="headingSM" color={colors.text.primary}>{title}</AppText>
      {action && onAction && (
        <Pressable onPress={onAction}>
          <AppText variant="labelMD" color={colors.brand.accent}>{action}</AppText>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['5'],
    gap: Spacing['3'],
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  greetingBlock: { flex: 1, gap: 1 },
  greetingName: { lineHeight: 22 },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card label
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },

  // Quick actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing['5'],
    marginBottom: Spacing['2'],
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing['2'],
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, textAlign: 'center' },

  // Sections
  section: { marginTop: Spacing['6'] },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },

  // Tx list
  txRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.12)' },
  txRowLast: { borderBottomWidth: 0 },

  // QuickAddSheet
  qaOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  qaSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: -6 } },
      android: { elevation: 20 },
    }),
  },
  qaHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.3)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  qaTypeRow: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  qaTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  qaAmountSection: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 12,
  },
  qaAmountDisplay: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  qaNumpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  qaNumKey: {
    width: '30%',
    flexGrow: 1,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaNumKeyText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  qaSectionLabel: {
    letterSpacing: 1,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 2,
  },
  qaCatScroll: {
    gap: 8,
    paddingBottom: 12,
    paddingRight: 8,
  },
  qaCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  qaCatIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaAccountScroll: {
    gap: 8,
    paddingBottom: 12,
    paddingRight: 8,
  },
  qaAccountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  qaAccountIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaNoteInput: {
    height: 44,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  qaAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: Radius.lg,
    marginTop: 4,
  },
  qaAddBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
