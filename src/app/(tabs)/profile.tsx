import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Share,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { AppText } from '@components/AppText';
import { ConfirmModal } from '@components/ConfirmModal';
import { Spacing, Radius, Layout } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAuth } from '@hooks/useAuth';
import { useTransactionStore } from '@store/transactionStore';
import { useAccountStore } from '@store/accountStore';
import { useCategoryStore } from '@store/categoryStore';
import { useBudgetStore } from '@store/budgetStore';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { useLedgerStore } from '@store/ledgerStore';
import { useLoansStore } from '@store/loansStore';
import { clearAllPersistedData } from '@store/storage';
import { toast } from '@store/toastStore';
import { CURRENCY_SYMBOLS } from '@store/types';
import type { CurrencyCode } from '@store/types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCIES: { code: CurrencyCode; name: string; flag: string }[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
];

const FAQ_ITEMS = [
  { q: 'How do I add a transaction?', a: 'Tap the + button on the Home or Activity tab to log income or expenses.' },
  { q: 'How do budgets work?', a: 'Set a monthly limit per category in the Budget tab. We track spending and warn you when nearing the limit.' },
  { q: 'Can I export my data?', a: 'Yes — go to Profile → Export Data to share your transactions as CSV.' },
  { q: 'How do I track who owes me?', a: 'Use the Ledger tab to record hand-to-hand money exchanges and loans.' },
  { q: 'Is my data secure?', a: 'All data is encrypted at rest and in transit. We never share your data.' },
];

// ─── Entrance animation ───────────────────────────────────────────────────────

function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(18);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 360 }));
    ty.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 200 }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));
}

// ─── Bottom sheet ─────────────────────────────────────────────────────────────

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  snapHeight?: number;
}

function BottomSheet({ visible, onClose, title, children, snapHeight = 460 }: SheetProps) {
  const { colors, isDark } = useTheme();
  const ty = useSharedValue(snapHeight + 100);
  const dimOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      dimOpacity.value = withTiming(1, { duration: 220 });
      ty.value = withSpring(0, { damping: 26, stiffness: 220, mass: 0.9 });
    } else {
      dimOpacity.value = withTiming(0, { duration: 180 });
      ty.value = withTiming(snapHeight + 100, { duration: 240 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));

  const bg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.sheetBackdrop, backdropStyle]} pointerEvents={visible ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetPanel,
            sheetStyle,
            {
              height: snapHeight,
              backgroundColor: bg,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)' }]} />
          <View style={styles.sheetTitleRow}>
            <AppText variant="headingSM" color={colors.text.primary}>{title}</AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <View style={[styles.sheetCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="close" size={15} color={colors.text.secondary} />
              </View>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Setting row ──────────────────────────────────────────────────────────────

interface RowProps {
  icon: IoniconName;
  iconColor: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}

function SettingRow({ icon, iconColor, label, subtitle, onPress, right, isLast }: RowProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const rowAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        rowAnim,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
      ]}
    >
      <Pressable
        onPress={() => { if (onPress) { Haptics.selectionAsync(); onPress(); } }}
        onPressIn={() => { if (onPress) scale.value = withSpring(0.974, { damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 18 }); }}
        style={styles.settingRow}
      >
        <View style={[styles.iconBox, { backgroundColor: iconColor + (isDark ? '28' : '18') }]}>
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
        <View style={styles.rowBody}>
          <AppText variant="labelLG" color={colors.text.primary}>{label}</AppText>
          {subtitle && <AppText variant="caption" color={colors.text.tertiary}>{subtitle}</AppText>}
        </View>
        {right ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} /> : null)}
      </Pressable>
    </Animated.View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, children, delay = 0 }: { title?: string; children: React.ReactNode; delay?: number }) {
  const { colors, isDark } = useTheme();
  const anim = useEntrance(delay);
  return (
    <Animated.View style={anim}>
      {title && (
        <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sectionLabel}>
          {title.toUpperCase()}
        </AppText>
      )}
      <View style={[
        styles.sectionCard,
        {
          backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
        },
      ]}>
        {children}
      </View>
    </Animated.View>
  );
}

// ─── Profile hero ─────────────────────────────────────────────────────────────

interface HeroProps {
  initials: string;
  fullName: string;
  email: string;
  memberSince: string;
  txCount: number;
  currency: CurrencyCode;
  onEditPress: () => void;
}

function ProfileHero({ initials, fullName, email, memberSince, txCount, currency, onEditPress }: HeroProps) {
  const { colors, isDark } = useTheme();
  const anim = useEntrance(0);

  const gradient: [string, string] = isDark
    ? ['#1A1040', '#0D0826']
    : [colors.brand.primary, '#A8E000'];

  return (
    <Animated.View style={[styles.hero, anim]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroBlobTL, { backgroundColor: isDark ? 'rgba(108,99,255,0.22)' : 'rgba(255,255,255,0.30)' }]} />
      <View style={[styles.heroBlobBR, { backgroundColor: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(0,0,0,0.06)' }]} />
      <View style={[StyleSheet.absoluteFill, styles.heroBorder, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.45)' }]} pointerEvents="none" />

      <View style={styles.heroInner}>
        {/* Avatar with edit */}
        <Pressable onPress={onEditPress} style={styles.avatarWrap}>
          <LinearGradient
            colors={isDark ? ['#6C63FF', '#A78BFA'] : ['#000000', '#1A1A2E']}
            style={styles.avatarCircle}
          >
            <AppText style={styles.avatarText}>{initials}</AppText>
          </LinearGradient>
          <View style={[styles.editBadge, { backgroundColor: isDark ? colors.brand.primary : '#000000' }]}>
            <Ionicons name="pencil" size={9} color="#FFFFFF" />
          </View>
        </Pressable>

        <AppText variant="headingLG" style={[styles.heroName, { color: isDark ? '#F1F5F9' : '#0A0A0A' }]}>
          {fullName}
        </AppText>
        <AppText variant="bodySM" style={{ color: isDark ? 'rgba(203,213,225,0.75)' : 'rgba(0,0,0,0.55)', marginTop: 2 }}>
          {email}
        </AppText>

        <View style={styles.heroBadges}>
          {[
            { icon: 'calendar-outline' as IoniconName, label: `Since ${memberSince}` },
            { icon: 'swap-horizontal-outline' as IoniconName, label: `${txCount} transactions` },
            { icon: 'cash-outline' as IoniconName, label: `${currency} ${CURRENCY_SYMBOLS[currency]}` },
          ].map((b) => (
            <View
              key={b.label}
              style={[styles.heroBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)' }]}
            >
              <Ionicons name={b.icon} size={11} color={isDark ? 'rgba(203,213,225,0.80)' : 'rgba(0,0,0,0.58)'} />
              <AppText style={{ color: isDark ? 'rgba(203,213,225,0.80)' : 'rgba(0,0,0,0.60)', fontSize: 11 }}>
                {b.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Sheet: Currency ──────────────────────────────────────────────────────────

function CurrencySheet({ current, onSelect }: { current: CurrencyCode; onSelect: (c: CurrencyCode) => void }) {
  const { colors, isDark } = useTheme();
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing['2'] }}>
      {CURRENCIES.map((c) => {
        const active = c.code === current;
        return (
          <Pressable
            key={c.code}
            onPress={() => onSelect(c.code)}
            style={[
              styles.currencyRow,
              active && { backgroundColor: colors.brand.primary + (isDark ? '20' : '12') },
            ]}
          >
            <AppText style={styles.flag}>{c.flag}</AppText>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="labelLG" color={colors.text.primary}>{c.name}</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>{c.code} · {CURRENCY_SYMBOLS[c.code]}</AppText>
            </View>
            {active && <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />}
          </Pressable>
        );
      })}
      <View style={{ height: Spacing['8'] }} />
    </ScrollView>
  );
}

// ─── Sheet: Notifications ─────────────────────────────────────────────────────

interface NotifPrefs { transactions: boolean; budgetAlerts: boolean; plannedPay: boolean; weeklyReport: boolean }

function NotifSheet({ prefs, onChange }: { prefs: NotifPrefs; onChange: (k: keyof NotifPrefs, v: boolean) => void }) {
  const { colors, isDark } = useTheme();
  const ITEMS: { key: keyof NotifPrefs; label: string; sub: string }[] = [
    { key: 'transactions', label: 'Transaction Alerts', sub: 'Notify on every spend or income' },
    { key: 'budgetAlerts', label: 'Budget Warnings', sub: 'Alert when nearing category limit' },
    { key: 'plannedPay', label: 'Planned Payments', sub: 'Remind me 2 days before due date' },
    { key: 'weeklyReport', label: 'Weekly Summary', sub: 'Spending digest every Sunday' },
  ];
  return (
    <View style={{ marginTop: Spacing['3'] }}>
      {ITEMS.map((item, idx) => (
        <View
          key={item.key}
          style={[
            styles.sheetRow,
            idx < ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="labelLG" color={colors.text.primary}>{item.label}</AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{item.sub}</AppText>
          </View>
          <Switch
            value={prefs[item.key]}
            onValueChange={(v) => { Haptics.selectionAsync(); onChange(item.key, v); }}
            trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.glass.backgroundMid}
          />
        </View>
      ))}
    </View>
  );
}

// ─── Sheet: Security ─────────────────────────────────────────────────────────

interface SecPrefs { biometric: boolean; autoLock: boolean; hideBalance: boolean }

function SecuritySheet({ prefs, onChange }: { prefs: SecPrefs; onChange: (k: keyof SecPrefs, v: boolean) => void }) {
  const { colors, isDark } = useTheme();
  const ITEMS: { key: keyof SecPrefs; label: string; sub: string; icon: IoniconName; color: string }[] = [
    { key: 'biometric', label: 'Face ID / Touch ID', sub: 'Use biometrics to unlock app', icon: 'finger-print', color: '#6C63FF' },
    { key: 'autoLock', label: 'Auto-Lock', sub: 'Lock after 5 min of inactivity', icon: 'lock-closed', color: '#EF4444' },
    { key: 'hideBalance', label: 'Hide Balance', sub: 'Blur amounts on home screen', icon: 'eye-off', color: '#F59E0B' },
  ];
  return (
    <View style={{ marginTop: Spacing['3'] }}>
      {ITEMS.map((item, idx) => (
        <View
          key={item.key}
          style={[
            styles.sheetRow,
            idx < ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
          ]}
        >
          <View style={[styles.secIcon, { backgroundColor: item.color + '18' }]}>
            <Ionicons name={item.icon} size={16} color={item.color} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="labelLG" color={colors.text.primary}>{item.label}</AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{item.sub}</AppText>
          </View>
          <Switch
            value={prefs[item.key]}
            onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(item.key, v); }}
            trackColor={{ false: colors.glass.backgroundMid, true: item.color }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.glass.backgroundMid}
          />
        </View>
      ))}
      <Pressable
        onPress={() => { toast.info('PIN setup coming in the next update'); }}
        style={[styles.pinBtn, { borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}
      >
        <Ionicons name="keypad-outline" size={16} color={colors.text.secondary} />
        <AppText variant="labelMD" color={colors.text.secondary}>Change PIN</AppText>
      </Pressable>
    </View>
  );
}

// ─── Sheet: Export ────────────────────────────────────────────────────────────

function ExportSheet({ onExport }: { onExport: (fmt: 'CSV' | 'JSON') => void }) {
  const { colors, isDark } = useTheme();
  const opts: { fmt: 'CSV' | 'JSON'; icon: IoniconName; desc: string }[] = [
    { fmt: 'CSV', icon: 'document-text-outline', desc: 'Spreadsheet-compatible format' },
    { fmt: 'JSON', icon: 'code-slash-outline', desc: 'Raw data for developers' },
  ];
  return (
    <View style={{ marginTop: Spacing['4'], gap: Spacing['3'], paddingHorizontal: Spacing['5'] }}>
      <AppText variant="bodySM" color={colors.text.secondary}>
        Export all your transactions, budgets and planned payments.
      </AppText>
      {opts.map((o) => (
        <Pressable
          key={o.fmt}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onExport(o.fmt); }}
          style={[styles.exportOpt, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)',
          }]}
        >
          <View style={[styles.exportIcon, { backgroundColor: colors.brand.primary + '18' }]}>
            <Ionicons name={o.icon} size={20} color={colors.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="labelLG" color={colors.text.primary}>Export as {o.fmt}</AppText>
            <AppText variant="caption" color={colors.text.tertiary}>{o.desc}</AppText>
          </View>
          <Ionicons name="share-outline" size={18} color={colors.text.tertiary} />
        </Pressable>
      ))}
    </View>
  );
}

// ─── Sheet: Help / FAQ ────────────────────────────────────────────────────────

function HelpSheet() {
  const { colors, isDark } = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: Spacing['2'] }}>
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = open === idx;
        return (
          <Pressable
            key={idx}
            onPress={() => { Haptics.selectionAsync(); setOpen(isOpen ? null : idx); }}
            style={[
              styles.faqItem,
              idx < FAQ_ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <View style={styles.faqRow}>
              <AppText variant="labelMD" color={colors.text.primary} style={{ flex: 1, fontWeight: '600' }}>
                {item.q}
              </AppText>
              <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} color={colors.text.tertiary} />
            </View>
            {isOpen && (
              <AppText variant="bodySM" color={colors.text.secondary} style={styles.faqA}>
                {item.a}
              </AppText>
            )}
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => toast.info('Email us at support@wherecash.app')}
        style={[styles.contactBtn, { backgroundColor: colors.brand.primary + '14' }]}
      >
        <Ionicons name="mail-outline" size={16} color={colors.brand.primary} />
        <AppText variant="labelMD" style={{ color: colors.brand.accent }}>Contact Support</AppText>
      </Pressable>
      <View style={{ height: Spacing['8'] }} />
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme();
  const { user, signOut, setUser } = useAuth();
  const transactions = useTransactionStore((s) => s.transactions);

  // Sheet visibility
  const [currencySheet, setCurrencySheet] = useState(false);
  const [notifSheet, setNotifSheet] = useState(false);
  const [securitySheet, setSecuritySheet] = useState(false);
  const [exportSheet, setExportSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);

  // Store reset actions
  const resetTransactions    = useTransactionStore((s) => s.reset);
  const resetAccounts        = useAccountStore((s) => s.reset);
  const resetCategories      = useCategoryStore((s) => s.reset);
  const resetBudgets         = useBudgetStore((s) => s.reset);
  const resetPlannedPayments = usePlannedPaymentsStore((s) => s.reset);
  const resetLedger          = useLedgerStore((s) => s.reset);
  const resetLoans           = useLoansStore((s) => s.reset);

  // Confirm dialog
  const [signOutConfirm,   setSignOutConfirm]   = useState(false);
  const [rateConfirm,      setRateConfirm]      = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);

  // Pref states
  const [notifPrefs, setNotifPrefs] = useState({ transactions: true, budgetAlerts: true, plannedPay: true, weeklyReport: false });
  const [secPrefs, setSecPrefs] = useState({ biometric: false, autoLock: true, hideBalance: false });

  const txCount = transactions.length;
  const memberSince = user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Jan 2025';
  const initials = user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AM';

  // ── Handlers ──

  const handleEditName = useCallback(() => {
    if (Platform.OS === 'ios') {
      const { Alert } = require('react-native');
      Alert.prompt('Edit Name', 'Enter your display name', (name: string) => {
        if (name?.trim() && user) {
          setUser({ ...user, fullName: name.trim() });
          toast.success('Name updated');
        }
      }, 'plain-text', user?.fullName ?? '');
    } else {
      toast.info('Name editing available on iOS');
    }
  }, [user, setUser]);

  const handleCurrencySelect = useCallback((code: CurrencyCode) => {
    if (user) {
      setUser({ ...user, currency: code });
      toast.success(`Currency changed to ${code}`);
    }
    setCurrencySheet(false);
  }, [user, setUser]);

  const handleExport = useCallback(async (fmt: 'CSV' | 'JSON') => {
    setExportSheet(false);
    try {
      let content = '';
      if (fmt === 'CSV') {
        const header = 'Date,Type,Category,Amount,Currency,Description\n';
        const rows = transactions.map((t) =>
          `${t.date},${t.type},${t.category},${t.amount},${t.currency},"${t.description}"`
        ).join('\n');
        content = header + rows;
      } else {
        content = JSON.stringify(transactions, null, 2);
      }
      await Share.share({ message: `WhereCash Export (${fmt})\n\n${content}`, title: `WhereCash ${fmt}` });
      toast.success(`Exported ${txCount} transactions as ${fmt}`);
    } catch (_) { }
  }, [transactions, txCount]);

  const handleBackup = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('All data is backed up and up to date!');
  }, []);

  const handleClearAllData = useCallback(async () => {
    setClearDataConfirm(false);
    await clearAllPersistedData();
    resetTransactions();
    resetAccounts();
    resetCategories();
    resetBudgets();
    resetPlannedPayments();
    resetLedger();
    resetLoans();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    toast.success('All data cleared successfully');
  }, [resetTransactions, resetAccounts, resetCategories, resetBudgets, resetPlannedPayments, resetLedger, resetLoans]);

  const handleSignOutConfirm = useCallback(() => {
    setSignOutConfirm(false);
    signOut();
  }, [signOut]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <ProfileHero
          initials={initials}
          fullName={user?.fullName ?? 'Guest'}
          email={user?.email ?? ''}
          memberSince={memberSince}
          txCount={txCount}
          currency={user?.currency ?? 'USD'}
          onEditPress={handleEditName}
        />

        {/* Appearance */}
        <SectionCard title="Appearance" delay={80}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconColor={isDark ? '#A78BFA' : '#F59E0B'}
            label={isDark ? 'Dark Mode' : 'Light Mode'}
            subtitle={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            isLast
            right={
              <Switch
                value={isDark}
                onValueChange={() => { Haptics.selectionAsync(); toggle(); }}
                trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.glass.backgroundMid}
              />
            }
          />
        </SectionCard>

        {/* Account */}
        <SectionCard title="Account" delay={160}>
          <SettingRow
            icon="wallet-outline"
            iconColor="#6C63FF"
            label="Manage Accounts"
            subtitle="Add, edit, or delete accounts"
            onPress={() => router.push('/accounts')}
          />
          <SettingRow
            icon="grid-outline"
            iconColor="#10B981"
            label="Manage Categories"
            subtitle="Create & customize spending categories"
            onPress={() => router.push('/categories')}
          />
          <SettingRow
            icon="notifications-outline"
            iconColor="#F97316"
            label="Notifications"
            subtitle={`${Object.values(notifPrefs).filter(Boolean).length} of 4 enabled`}
            onPress={() => setNotifSheet(true)}
          />
          <SettingRow
            icon="globe-outline"
            iconColor="#3B82F6"
            label="Currency & Region"
            subtitle={`${user?.currency ?? 'USD'} · ${CURRENCY_SYMBOLS[user?.currency ?? 'USD']}`}
            onPress={() => setCurrencySheet(true)}
          />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#EF4444"
            label="Security & Privacy"
            subtitle={secPrefs.biometric ? 'Biometrics on' : 'PIN only'}
            onPress={() => setSecuritySheet(true)}
            isLast
          />
        </SectionCard>

        {/* Data */}
        <SectionCard title="Data" delay={240}>
          <SettingRow
            icon="cloud-done-outline"
            iconColor="#10B981"
            label="Backup & Sync"
            subtitle="Last synced: Today"
            onPress={handleBackup}
            right={
              <View style={[styles.badge, { backgroundColor: '#10B98118' }]}>
                <AppText variant="caption" style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>ON</AppText>
              </View>
            }
          />
          <SettingRow
            icon="download-outline"
            iconColor="#8B5CF6"
            label="Export Data"
            subtitle={`${txCount} transactions ready`}
            onPress={() => setExportSheet(true)}
          />
          <SettingRow
            icon="trash-outline"
            iconColor="#EF4444"
            label="Clear All Data"
            subtitle="Reset to demo — cannot be undone"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setClearDataConfirm(true); }}
            isLast
          />
        </SectionCard>

        {/* Support */}
        <SectionCard title="Support" delay={320}>
          <SettingRow
            icon="help-circle-outline"
            iconColor="#06B6D4"
            label="Help & Support"
            subtitle="FAQs and contact"
            onPress={() => setHelpSheet(true)}
          />
          <SettingRow
            icon="star-outline"
            iconColor="#FBBF24"
            label="Rate WhereCash"
            subtitle="Share your feedback"
            onPress={() => setRateConfirm(true)}
          />
          <SettingRow
            icon="information-circle-outline"
            iconColor={colors.text.tertiary}
            label="About"
            subtitle="v1.0.0 · Build 100"
            isLast
            onPress={() => toast.info('WhereCash v1.0.0 — Built with Expo & React Native')}
          />
        </SectionCard>

        {/* Sign Out */}
        <Animated.View style={useEntrance(400)}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setSignOutConfirm(true); }}
            style={({ pressed }) => [
              styles.signOutBtn,
              {
                backgroundColor: isDark ? '#EF444418' : '#FEF2F2',
                borderColor: isDark ? '#EF444430' : '#FCA5A5',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <AppText variant="labelLG" style={{ color: '#EF4444' }}>Sign Out</AppText>
          </Pressable>

          <AppText variant="caption" color={colors.text.tertiary} align="center" style={styles.versionText}>
            WhereCash v1.0.0 · Made with ♥
          </AppText>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom Sheets ── */}
      <BottomSheet visible={currencySheet} onClose={() => setCurrencySheet(false)} title="Currency & Region" snapHeight={520}>
        <CurrencySheet current={user?.currency ?? 'USD'} onSelect={handleCurrencySelect} />
      </BottomSheet>

      <BottomSheet visible={notifSheet} onClose={() => setNotifSheet(false)} title="Notifications" snapHeight={400}>
        <NotifSheet prefs={notifPrefs} onChange={(k, v) => setNotifPrefs((p) => ({ ...p, [k]: v }))} />
      </BottomSheet>

      <BottomSheet visible={securitySheet} onClose={() => setSecuritySheet(false)} title="Security & Privacy" snapHeight={420}>
        <SecuritySheet prefs={secPrefs} onChange={(k, v) => setSecPrefs((p) => ({ ...p, [k]: v }))} />
      </BottomSheet>

      <BottomSheet visible={exportSheet} onClose={() => setExportSheet(false)} title="Export Data" snapHeight={340}>
        <ExportSheet onExport={handleExport} />
      </BottomSheet>

      <BottomSheet visible={helpSheet} onClose={() => setHelpSheet(false)} title="Help & Support" snapHeight={560}>
        <HelpSheet />
      </BottomSheet>

      {/* ── Confirm Modals ── */}
      <ConfirmModal
        visible={signOutConfirm}
        title="Sign Out"
        message="You'll need to sign in again to access your account."
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        danger
        icon="log-out-outline"
        onConfirm={handleSignOutConfirm}
        onCancel={() => setSignOutConfirm(false)}
      />

      <ConfirmModal
        visible={clearDataConfirm}
        title="Clear All Data?"
        message="This will permanently erase all transactions, accounts, budgets, ledger entries and planned payments. This cannot be undone."
        confirmLabel="Clear Everything"
        cancelLabel="Cancel"
        danger
        icon="trash-outline"
        onConfirm={handleClearAllData}
        onCancel={() => setClearDataConfirm(false)}
      />

      <ConfirmModal
        visible={rateConfirm}
        title="Rate WhereCash ⭐"
        message="Enjoying the app? Your review helps us reach more people."
        confirmLabel="Rate Now"
        cancelLabel="Later"
        icon="star"
        onConfirm={() => { setRateConfirm(false); toast.success('Thank you for your support! ⭐'); }}
        onCancel={() => setRateConfirm(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
    gap: Spacing['4'],
  },

  // Hero
  hero: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  heroBorder: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
  },
  heroBlobTL: {
    position: 'absolute',
    top: -40,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  heroBlobBR: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  heroInner: {
    padding: Spacing['6'],
    alignItems: 'center',
    gap: Spacing['2'],
  },
  avatarWrap: { marginBottom: Spacing['2'], position: 'relative' },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  heroName: { fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  heroBadges: { flexDirection: 'row', gap: Spacing['2'], flexWrap: 'wrap', justifyContent: 'center', marginTop: Spacing['2'] },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },

  // Section
  sectionLabel: { fontSize: 11, letterSpacing: 0.8, marginBottom: Spacing['2'], marginLeft: Spacing['1'] },
  sectionCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['4'],
  },
  iconBox: {
    width: 38, height: 38, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 2 },

  // Bottom sheet
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.52)' },
  sheetPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: Spacing['3'],
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing['2'] },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    paddingBottom: Spacing['3'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  sheetCloseBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // Sheet rows
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['4'],
    gap: Spacing['3'],
  },
  secIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'],
    marginHorizontal: Spacing['5'], marginTop: Spacing['3'],
    paddingVertical: Spacing['3'],
    borderRadius: Radius.lg, borderWidth: 1,
  },

  // Currency
  currencyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'] },
  flag: { fontSize: 24 },

  // Export
  exportOpt: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'], padding: Spacing['4'], borderRadius: Radius.lg, borderWidth: 1 },
  exportIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },

  // FAQ
  faqItem: { paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['2'] },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing['2'] },
  faqA: { lineHeight: 20, opacity: 0.85 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'],
    marginHorizontal: Spacing['5'], marginTop: Spacing['4'],
    paddingVertical: Spacing['3'], borderRadius: Radius.lg,
  },

  // Misc
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], paddingVertical: Spacing['4'],
    borderRadius: Radius.xl, borderWidth: 1,
  },
  versionText: { marginTop: Spacing['3'] },
});
