import { useState, useCallback, useEffect, type ComponentProps } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useDashboardData } from '@features/dashboard/hooks/useDashboardData';
import { useQuickAddTransaction } from '@features/transactions/hooks/useQuickAddTransaction';
import { NUMPAD_KEYS } from '@features/transactions/utils/numpad';
import { BalanceCard } from '@features/dashboard/components/BalanceCard';
import { QuickStatCard } from '@features/dashboard/components/QuickStatCard';
import { SpendingChart } from '@features/dashboard/components/SpendingChart';
import { RecentTransactionRow } from '@features/dashboard/components/RecentTransactionRow';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { EmptyState } from '@components/EmptyState';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import type { Transaction } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
const { height: SH } = Dimensions.get('window');

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
  const [catFormVisible, setCatFormVisible] = useState(false);

  const {
    type, handleTypeChange,
    handleKey, category, setCategory,
    accountId, setAccountId,
    note, setNote,
    cats, accounts, amountDisplay, accentColor,
    handleSave, reset,
  } = useQuickAddTransaction(onClose);

  const slideY = useSharedValue(SH * 0.9);

  useEffect(() => {
    if (visible) {
      reset(initialType);
      slideY.value = withTiming(0, { duration: 360, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH * 0.9, { duration: 280, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, initialType]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const sheetBg = isDark ? '#131722' : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F3F4F6';

  return (
    <>
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
                    handleTypeChange(t);
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
                    handleKey(key);
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
            {cats.map((catDef) => {
              const active = category === catDef.id;
              return (
                <Pressable
                  key={catDef.id}
                  onPress={() => {
                    setCategory(catDef.id);
                    Haptics.selectionAsync();
                  }}
                  style={[
                    styles.qaCatChip,
                    {
                      backgroundColor: active ? catDef.color + '20' : inputBg,
                      borderColor: active ? catDef.color + '50' : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={[styles.qaCatIcon, { backgroundColor: catDef.color + '20' }]}>
                    <Ionicons name={catDef.icon as any} size={15} color={catDef.color} />
                  </View>
                  <AppText
                    variant="labelSM"
                    style={{
                      color: active ? catDef.color : colors.text.secondary,
                      fontWeight: active ? '700' : '500',
                      fontSize: 11,
                    }}
                  >
                    {catDef.label}
                  </AppText>
                </Pressable>
              );
            })}
            {/* + New category chip */}
            <Pressable
              onPress={() => { setCatFormVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.qaCatChip, styles.qaCatNewChip, { borderColor: colors.brand.primary + '45' }]}
            >
              <View style={[styles.qaCatIcon, { backgroundColor: colors.brand.primary + '18' }]}>
                <Ionicons name="add" size={15} color={colors.brand.primary} />
              </View>
              <AppText variant="labelSM" style={{ color: colors.brand.primary, fontWeight: '600', fontSize: 11 }}>
                New
              </AppText>
            </Pressable>
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
    <CategoryFormSheet
      visible={catFormVisible}
      onClose={() => setCatFormVisible(false)}
      onSaved={(id) => setCategory(id)}
    />
    </>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { data, isLoading, isError, isEmpty, refresh } = useDashboardData();
  const user = useAuthStore((s) => s.user);

  const [addVisible, setAddVisible] = useState(false);
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');

  const handleTransactionPress = useCallback((_tx: Transaction) => {
    router.push('/(tabs)/transactions');
  }, []);

  const openAdd = (type: 'expense' | 'income') => {
    setAddType(type);
    setAddVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const quickActions: { icon: IoniconName; label: string; color: string; action: () => void }[] = [
    { icon: 'trending-down',  label: 'Expense',  color: '#EF4444',            action: () => openAdd('expense') },
    { icon: 'trending-up',    label: 'Income',   color: '#10B981',            action: () => openAdd('income') },
    { icon: 'shuffle',        label: 'Split',    color: colors.brand.primary, action: () => toast.info('Split expenses — coming soon') },
    { icon: 'receipt',        label: 'Activity', color: '#F59E0B',            action: () => router.push('/(tabs)/transactions') },
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
          totalBalance={data?.totalBalance ?? 0}
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
          {quickActions.map(({ icon, label, color, action }) => (
            <Pressable
              key={label}
              onPress={action}
              style={({ pressed }) => [styles.actionItem, { opacity: pressed ? 0.75 : 1 }]}
            >
              {/* Outer: border ring only — no overflow:hidden so iOS blur works */}
              <View style={[styles.actionIconOuter, { borderColor: color + '55' }]}>
                {/* Inner clip: rounds the blur/gradient to the box */}
                <View style={styles.actionIconClip}>
                  {/* 1. Frosted glass base */}
                  <BlurView
                    intensity={isDark ? 50 : 70}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* 2. Liquid color gradient */}
                  <LinearGradient
                    colors={[color + '70', color + '28']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* 3. Top-edge shine — glass refraction */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.00)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0.6, y: 1 }}
                    style={styles.actionIconShine}
                  />
                  {/* 4. Icon */}
                  <Ionicons name={icon} size={24} color={color} />
                </View>
              </View>
              <AppText variant="caption" style={[styles.actionLabel, { color: colors.text.secondary }]}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* ── Data sections OR setup prompt ─────────────────────── */}
        {isEmpty ? (
          <View style={styles.section}>
            <HomeSetupPrompt onLogExpense={() => openAdd('expense')} />
          </View>
        ) : (
          <>
            {/* This Month */}
            {data && (
              <View style={styles.section}>
                <SectionTitle title="This Month" />
                <View style={styles.statsRow}>
                  <QuickStatCard label="Income"   amount={data.monthSummary.totalIncome}  type="income"  iconEmoji="💰" />
                  <QuickStatCard label="Expenses" amount={data.monthSummary.totalExpense} type="expense" iconEmoji="💸" />
                </View>
              </View>
            )}

            {/* Spending Chart — only when there's something to show */}
            {data && data.spendingByCategory.length > 0 && (
              <View style={styles.section}>
                <SectionTitle title="Where it went" />
                <SpendingChart data={data.spendingByCategory} isLoading={isLoading} />
              </View>
            )}

            {/* Recent Activity */}
            {data && data.recentTransactions.length > 0 && (
              <View style={styles.section}>
                <SectionTitle
                  title="Recent Activity"
                  action="See all"
                  onAction={() => router.push('/(tabs)/transactions')}
                />
                <GlassCard padding={0}>
                  {data.recentTransactions.map((tx, idx) => (
                    <View
                      key={tx.id}
                      style={[styles.txRow, idx === data.recentTransactions.length - 1 && styles.txRowLast]}
                    >
                      <RecentTransactionRow transaction={tx} onPress={handleTransactionPress} />
                    </View>
                  ))}
                </GlassCard>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <QuickAddSheet
        visible={addVisible}
        initialType={addType}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Home Setup Prompt (shown when app is fresh / all data cleared) ───────────

const SETUP_STEPS = [
  {
    icon:     'wallet-outline'    as const,
    color:    '#6366F1',
    title:    'Add your first account',
    subtitle: 'Link a bank, cash wallet, or savings account',
    action:   'accounts' as const,
  },
  {
    icon:     'receipt-outline'   as const,
    color:    '#10B981',
    title:    'Log an expense or income',
    subtitle: 'Track where your money comes and goes',
    action:   'transaction' as const,
  },
  {
    icon:     'bar-chart-outline' as const,
    color:    '#F59E0B',
    title:    'Set a monthly budget',
    subtitle: 'Limit spending per category and hit your goals',
    action:   'budget' as const,
  },
] as const;

function HomeSetupPrompt({ onLogExpense }: { onLogExpense: () => void }) {
  const { colors, isDark } = useTheme();
  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';
  const accentHex = colors.brand.primary;

  const handleStep = (action: 'accounts' | 'transaction' | 'budget') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (action === 'accounts')    router.push('/accounts');
    else if (action === 'budget') router.push('/(tabs)/budget');
    else                          onLogExpense();
  };

  return (
    <View style={hs.root}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140)} style={hs.heroWrap}>
        <View style={[hs.outerRing, { borderColor: accentHex + '28' }]} />
        <LinearGradient
          colors={[accentHex, colors.brand.accent] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={hs.iconCircle}
        >
          <Ionicons name="rocket-outline" size={36} color="#fff" />
        </LinearGradient>
        <View style={[hs.badge, hs.badgeBR, { backgroundColor: accentHex + '20' }]}>
          <Ionicons name="sparkles" size={13} color={accentHex} />
        </View>
      </Animated.View>

      {/* ── Text ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.springify().damping(20).stiffness(140).delay(80)} style={hs.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">
          Welcome to WhereCash
        </AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={hs.subtitle}>
          3 quick steps to start tracking your money and hitting your goals.
        </AppText>
      </Animated.View>

      {/* ── Step rows (tappable) ──────────────────────────────── */}
      <View style={hs.stepsCol}>
        {SETUP_STEPS.map((step, i) => (
          <Animated.View
            key={step.title}
            entering={FadeInDown.springify().damping(20).stiffness(140).delay(160 + i * 70)}
          >
            <Pressable
              onPress={() => handleStep(step.action)}
              style={({ pressed }) => [
                hs.stepRow,
                { backgroundColor: cardBg, borderColor: step.color + '22', opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <View style={[hs.stepIcon, { backgroundColor: step.color + '15' }]}>
                <Ionicons name={step.icon} size={16} color={step.color} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelMD" color={colors.text.primary}>{step.title}</AppText>
                <AppText variant="caption" color={colors.text.secondary} style={{ lineHeight: 17, marginTop: 1 }}>
                  {step.subtitle}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* ── Hint ─────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(400)}
        style={[hs.hint, { backgroundColor: accentHex + '0C', borderColor: accentHex + '25' }]}
      >
        <Ionicons name="shield-checkmark-outline" size={14} color={accentHex} />
        <AppText variant="caption" color={colors.text.secondary} style={{ flex: 1, lineHeight: 17 }}>
          All your data stays on this device. Nothing is uploaded without your permission.
        </AppText>
      </Animated.View>
    </View>
  );
}

const hs = StyleSheet.create({
  root:      { alignItems: 'center', paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'], gap: Spacing['4'] },
  heroWrap:  { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 118, height: 118, borderRadius: 59, borderWidth: 1.5, borderStyle: 'dashed' },
  iconCircle: {
    width: 82, height: 82, borderRadius: 41,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 12 },
    }),
  },
  badge:     { position: 'absolute', width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeBR:   { bottom: 14, right: 10 },
  textBlock: { alignItems: 'center', gap: Spacing['2'] },
  subtitle:  { maxWidth: 280, lineHeight: 20 },
  stepsCol:  { alignSelf: 'stretch', gap: Spacing['2'] },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['3'],
    padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  stepIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hint: {
    alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-start',
    gap: Spacing['2'], padding: Spacing['3'], borderRadius: Radius.lg, borderWidth: 1,
  },
});

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
    gap: 7,
  },
  actionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconOuter: {
    width: 62,
    height: 62,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 2,
  },
  actionIconClip: {
    flex: 1,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 16,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

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
  qaCatNewChip: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
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
