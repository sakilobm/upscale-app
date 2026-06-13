import { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  Easing,
} from 'react-native-reanimated';
import { AppHeader } from '@components/AppHeader';
import { FAB } from '@components/FAB';
import { useBudgets } from '@features/budget/hooks/useBudgets';
import { ProgressRingMatrix } from '@features/budget/components/ProgressRingMatrix';
import { PlannedPaymentsTimeline } from '@features/budget/components/PlannedPaymentsTimeline';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { toast } from '@store/toastStore';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useCategoryStore } from '@store/categoryStore';
import { CategoryFormSheet } from '@components/CategoryFormSheet';


// ─── Add Payment Sheet ────────────────────────────────────────────────────────

interface AddPaymentSheetProps {
  visible:  boolean;
  onClose:  () => void;
  onSubmit: (data: {
    title:    string;
    amount:   number;
    dueDate:  string;
    category: string;
  }) => void;
}

function AddPaymentSheet({ visible, onClose, onSubmit }: AddPaymentSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const allCategories = useCategoryStore((s) => s.categories);

  // Show all expense + both categories; always include 'other'
  const cats = allCategories.filter(
    (c) => c.applicableTo === 'expense' || c.applicableTo === 'both'
  );

  const [title,          setTitle]          = useState('');
  const [amount,         setAmount]         = useState('');
  const [dueDate,        setDueDate]        = useState('');
  const [category,       setCategory]       = useState('other');
  const [createVisible,  setCreateVisible]  = useState(false);

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   scale.value,
  }));

  const handleShow = () => scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  const handleHide = () => scale.value = withSpring(0.86, { damping: 18, stiffness: 220 });

  const reset = () => {
    setTitle(''); setAmount(''); setDueDate(''); setCategory('other');
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!title.trim())          { toast.error('Title is required');       return; }
    if (!parsed || parsed <= 0) { toast.error('Enter a valid amount');    return; }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast.error('Date format: YYYY-MM-DD'); return;
    }
    onSubmit({ title: title.trim(), amount: parsed, dueDate, category });
    reset();
    onClose();
  };

  const cardBg  = isDark ? colors.background.secondary : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F5F5F7';

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        onShow={handleShow}
        onDismiss={handleHide}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={isDark ? 40 : 30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetOuter}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              { backgroundColor: cardBg, paddingBottom: Math.max(insets.bottom, Spacing['5']) },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <AppText variant="headingSM" color={colors.text.primary}>Add Planned Payment</AppText>
              <Pressable onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.text.tertiary} />
              </Pressable>
            </View>

            {/* Title */}
            <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>TITLE</AppText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
              placeholder="e.g. Rent, Netflix, Insurance"
              placeholderTextColor={colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
            />

            {/* Amount + Due Date */}
            <View style={styles.rowFields}>
              <View style={{ flex: 1 }}>
                <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>AMOUNT ($)</AppText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.text.tertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>DUE DATE</AppText>
                <TextInput
                  style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.tertiary}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.catHeader}>
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>CATEGORY</AppText>
              <Pressable
                onPress={() => setCreateVisible(true)}
                style={[styles.createCatBtn, { backgroundColor: colors.brand.primary + '15', borderColor: colors.brand.primary + '45' }]}
              >
                <Ionicons name="add" size={13} color={colors.brand.primary} />
                <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '600' }}>New</AppText>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {cats.map((cat) => {
                const isSelected = cat.id === category;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategory(cat.id)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isSelected ? cat.color + '1A' : inputBg,
                        borderColor:     isSelected ? cat.color + '55' : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <View style={[styles.catIconBox, { backgroundColor: cat.color + '22' }]}>
                      <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                    </View>
                    <AppText
                      variant="caption"
                      style={{ color: isSelected ? cat.color : colors.text.secondary, fontWeight: isSelected ? '700' : '500' }}
                    >
                      {cat.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.brand.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color={isDark ? '#000' : '#FFFFFF'} />
              <AppText variant="labelLG" style={{ color: isDark ? '#000' : '#FFFFFF', fontWeight: '700' }}>
                Add Payment
              </AppText>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <CategoryFormSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onSaved={(id) => setCategory(id)}
      />
    </>
  );
}

// ─── Budget Empty State ───────────────────────────────────────────────────────

const GHOST_CATEGORIES = [
  { icon: 'home-outline',      label: 'Housing',   pct: 72, color: '#6366F1' },
  { icon: 'fast-food-outline', label: 'Food',      pct: 48, color: '#F59E0B' },
  { icon: 'car-outline',       label: 'Transport', pct: 90, color: '#EF4444' },
];

const BENEFITS = [
  { icon: 'bar-chart-outline',       text: 'Spending vs. limit bars' },
  { icon: 'notifications-outline',   text: 'Overspend alerts' },
  { icon: 'trending-down-outline',   text: 'Monthly insights' },
];

function BudgetEmptyState() {
  const { colors, isDark } = useTheme();

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0,  { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);

  // Scale-only pulse — no opacity here to avoid layout-animation conflict
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <View style={es.root}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.springify().damping(22).stiffness(140)} style={es.heroWrap}>
        {/* Outer glow ring (pulsing) */}
        <Animated.View style={[es.glowRing, { backgroundColor: colors.brand.primary + '18' }, pulseStyle]} />
        {/* Mid ring */}
        <View style={[es.midRing, { borderColor: colors.brand.primary + '28' }]} />
        {/* Icon circle */}
        <View style={es.iconCircle}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="wallet-outline" size={38} color="#fff" />
        </View>
        {/* Floating decorative dots */}
        <View style={[es.floatDot, es.dotTL, { backgroundColor: '#6366F1' }]} />
        <View style={[es.floatDot, es.dotTR, { backgroundColor: '#F59E0B' }]} />
        <View style={[es.floatDot, es.dotBL, { backgroundColor: '#10B981' }]} />
        <View style={[es.floatDot, es.dotBR, { backgroundColor: '#EF4444' }]} />
      </Animated.View>

      {/* ── Text ─────────────────────────────────────────────── */}
      <Animated.View entering={FadeInDown.springify().damping(22).stiffness(140).delay(80)} style={es.textBlock}>
        <AppText variant="headingMD" color={colors.text.primary} align="center">
          No budgets yet
        </AppText>
        <AppText variant="bodySM" color={colors.text.secondary} align="center" style={es.subtitle}>
          Set monthly limits per category to stay on track and build better money habits.
        </AppText>
      </Animated.View>

      {/* ── Ghost Preview Cards ───────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(160)}
        style={es.previewRow}
      >
        {GHOST_CATEGORIES.map((cat, i) => (
          <View
            key={cat.label}
            style={[es.previewCard, { backgroundColor: cardBg, borderColor: cat.color + '28', opacity: 1 - i * 0.14 }]}
          >
            <View style={[es.previewIconBox, { backgroundColor: cat.color + '18' }]}>
              <Ionicons name={cat.icon as any} size={17} color={cat.color} />
            </View>
            <AppText variant="caption" color={colors.text.primary} style={es.previewLabel}>
              {cat.label}
            </AppText>
            <View style={[es.miniBarTrack, { backgroundColor: colors.glass.backgroundMid }]}>
              <View style={[es.miniBarFill, { width: `${cat.pct}%`, backgroundColor: cat.color + '60' }]} />
            </View>
            <AppText variant="caption" color={colors.text.tertiary}>
              $0 / —
            </AppText>
          </View>
        ))}
      </Animated.View>

      {/* ── Benefits ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(240)}
        style={es.benefitsCol}
      >
        {BENEFITS.map(({ icon, text }) => (
          <View
            key={text}
            style={[es.benefitRow, { backgroundColor: isDark ? colors.background.secondary : '#FFFFFF', borderColor: colors.glass.border }]}
          >
            <View style={[es.benefitIconBox, { backgroundColor: colors.brand.primary + '15' }]}>
              <Ionicons name={icon as any} size={15} color={colors.brand.primary} />
            </View>
            <AppText variant="bodySM" color={colors.text.secondary} style={{ flex: 1 }}>{text}</AppText>
            <Ionicons name="checkmark-circle" size={16} color={colors.brand.primary + '80'} />
          </View>
        ))}
      </Animated.View>

      {/* ── Hint ─────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.springify().damping(22).stiffness(140).delay(320)}
        style={es.hintRow}
      >
        <Ionicons name="arrow-down-circle-outline" size={15} color={colors.text.tertiary} />
        <AppText variant="caption" color={colors.text.tertiary}>
          Tap{' '}
          <AppText variant="caption" style={{ color: colors.brand.primary, fontWeight: '700' }}>
            + Payment
          </AppText>
          {' '}below to schedule your first payment
        </AppText>
      </Animated.View>

    </View>
  );
}

const es = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingTop: Spacing['6'],
    paddingBottom: Spacing['4'],
    gap: Spacing['5'],
  },

  // Hero
  heroWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  midRing: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18 },
      android: { elevation: 12 },
    }),
  },
  floatDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  dotTL: { top: 18, left: 20 },
  dotTR: { top: 22, right: 16 },
  dotBL: { bottom: 20, left: 14 },
  dotBR: { bottom: 18, right: 22 },

  // Text
  textBlock: { alignItems: 'center', gap: Spacing['2'], paddingHorizontal: Spacing['4'] },
  subtitle:  { lineHeight: 20, maxWidth: 280 },

  // Ghost preview
  previewRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
    paddingHorizontal: Spacing['2'],
    alignSelf: 'stretch',
  },
  previewCard: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing['3'],
    gap: 4,
    alignItems: 'flex-start',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  previewIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLabel: { fontWeight: '600', marginTop: 2 },
  miniBarTrack: { height: 5, borderRadius: 3, width: '100%', overflow: 'hidden', marginTop: 2 },
  miniBarFill:  { height: '100%', borderRadius: 3 },

  // Benefits
  benefitsCol: { gap: Spacing['2'], alignSelf: 'stretch', paddingHorizontal: Spacing['2'] },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    padding: Spacing['3'],
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  benefitIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    opacity: 0.7,
    paddingHorizontal: Spacing['4'],
  },
});

// ─── Animated Overview Icon ──────────────────────────────────────────────────
interface AnimatedIconProps {
  iconName: any;
  iconColor: string;
  badgeBg: string;
  isOver: boolean;
}

function AnimatedIcon({ iconName, iconColor, badgeBg, isOver }: AnimatedIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isOver) {
      scale.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 600 }), withTiming(1.0, { duration: 600 })),
        -1, true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isOver, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.iconBadge, { backgroundColor: badgeBg }, animatedStyle]}>
      <Ionicons name={iconName} size={18} color={iconColor} />
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const { colors } = useTheme();
  const { data: budgetsData, isLoading, isEmpty, refresh, summary } = useBudgets();
  const budgets = budgetsData ?? [];

  const payments      = usePlannedPaymentsStore((s) => s.payments);
  const settlePayment = usePlannedPaymentsStore((s) => s.settlePayment);
  const deletePayment = usePlannedPaymentsStore((s) => s.deletePayment);
  const addPayment    = usePlannedPaymentsStore((s) => s.addPayment);

  const [addVisible, setAddVisible] = useState(false);

  const percent   = summary ? summary.percentUsed : 0;
  const isOver    = percent > 100;
  const isWarning = percent >= 85 && percent <= 100;

  let iconName: any = 'wallet-outline';
  let iconColor = colors.brand.primary;
  let badgeBg   = colors.brand.primary + '18';
  if (isOver)    { iconName = 'alert-circle'; iconColor = colors.status.expense; badgeBg = colors.status.expense + '20'; }
  else if (isWarning) { iconName = 'trending-up'; iconColor = '#F59E0B'; badgeBg = '#F59E0B20'; }

  const dynamicBorderColor = isOver
    ? colors.status.expense + '50'
    : isWarning ? '#F59E0B60' : colors.brand.primary + '30';

  const overviewGradient: [string, string] = isOver
    ? [colors.status.expense, colors.status.expense]
    : isWarning ? ['#F59E0B', '#D97706'] : [colors.brand.primary, colors.brand.accent];

  const progressShared = useSharedValue(0);
  useEffect(() => {
    if (summary) {
      progressShared.value = withSpring(Math.min(summary.percentUsed / 100, 1), { damping: 18, stiffness: 120 });
    }
  }, [summary?.percentUsed]);

  const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progressShared.value * 100}%` }));
  const remaining = summary ? summary.totalLimit - summary.totalSpent : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['8'] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.brand.primary} />}
      >
        <AppHeader
          title="Budget"
          subtitle="Monthly spending limits"
          noPadding
        />

        {summary && (
          <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120)}>
            <GlassCard
              padding={Spacing['5']}
              borderRadius={Radius.xl}
              borderGlow={isOver || isWarning}
              style={[styles.overviewCard, { borderColor: dynamicBorderColor }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <AnimatedIcon iconName={iconName} iconColor={iconColor} badgeBg={badgeBg} isOver={isOver} />
                  <View>
                    <AppText variant="labelMD" color={colors.text.secondary}>Monthly Overview</AppText>
                    <AppText variant="caption" color={colors.text.tertiary}>Tracking period: Current Month</AppText>
                  </View>
                </View>
                <AppText
                  variant="headingMD"
                  color={isOver ? colors.status.expense : isWarning ? '#F59E0B' : colors.status.income}
                >
                  {summary.percentUsed.toFixed(0)}%
                </AppText>
              </View>

              <View style={styles.metricsRow}>
                <View>
                  <AppText variant="numericLG" color={colors.text.primary}>${summary.totalSpent.toFixed(0)}</AppText>
                  <AppText variant="caption" color={colors.text.secondary}>spent of ${summary.totalLimit.toFixed(0)}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="numeric" color={isOver ? colors.status.expense : colors.status.income}>
                    {isOver ? '-' : ''}${Math.abs(remaining).toFixed(0)}
                  </AppText>
                  <AppText variant="caption" color={colors.text.secondary}>
                    {isOver ? 'over budget' : 'remaining'}
                  </AppText>
                </View>
              </View>

              <View style={[styles.progressContainer, { backgroundColor: colors.glass.backgroundMid }]}>
                <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
                  <LinearGradient colors={overviewGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                </Animated.View>
              </View>

              {summary.overBudgetCount > 0 && (
                <View style={styles.cardFooter}>
                  <Ionicons name="warning" size={14} color={colors.status.expense} />
                  <AppText variant="caption" style={{ color: colors.status.expense, fontWeight: '600' }}>
                    {summary.overBudgetCount} category budget{summary.overBudgetCount > 1 ? 's' : ''} exceeded
                  </AppText>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {isLoading && !budgets.length ? (
          <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
        ) : isEmpty ? (
          <BudgetEmptyState />
        ) : (
          <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(100)}>
            <ProgressRingMatrix budgets={budgets} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.springify().damping(16).stiffness(120).delay(200)} style={styles.timelineWrapper}>
          <PlannedPaymentsTimeline payments={payments} onSettle={settlePayment} onDelete={deletePayment} />
        </Animated.View>
      </ScrollView>

      <AddPaymentSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onSubmit={({ title, amount, dueDate, category }) => {
          addPayment({ title, amount, dueDate, category, isRecurring: false });
          toast.success(`"${title}" added to planned payments`);
        }}
      />

      <FAB icon="add" label="Payment" onPress={() => setAddVisible(true)} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['2'],
    gap:               Spacing['4'],
  },
  overviewCard: {},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  iconBadge: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing['4'],
  },
  progressContainer: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },
  progressBarFill:   { height: '100%', borderRadius: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing['4'] },
  loader:          { marginTop: Spacing['10'] },
  timelineWrapper: {},

  // Add Payment Sheet
  sheetOuter: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal:    Spacing['5'],
    paddingTop:           Spacing['3'],
    gap:                  Spacing['3'],
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    alignSelf: 'center', width: 36, height: 4,
    borderRadius: 2, marginBottom: Spacing['2'],
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel:  { fontSize: 10, letterSpacing: 0.8, marginBottom: -Spacing['1'] },
  input: {
    height: 46, borderRadius: Radius.lg,
    paddingHorizontal: Spacing['4'], fontSize: 15,
  },
  rowFields: { flexDirection: 'row', gap: Spacing['3'] },
  catHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createCatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1,
  },
  catRow: { gap: Spacing['2'] },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing['3'], paddingVertical: 8,
    borderRadius: Radius.lg,
  },
  catIconBox: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], height: 52, borderRadius: Radius.xl, marginTop: Spacing['2'],
  },

  // Create Category Modal
  createOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  createSheet: {
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal:    Spacing['5'],
    paddingTop:           Spacing['3'],
    maxHeight:            '92%',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 28 },
    }),
  },
  createScroll:  { gap: Spacing['4'], paddingBottom: Spacing['2'] },
  previewRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  iconPreview: {
    width: 60, height: 60, borderRadius: 18,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  nameInput: {
    height: 52, borderRadius: Radius.lg,
    paddingHorizontal: Spacing['4'], fontSize: 15,
  },
  pickerLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: -Spacing['1'] },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['3'] },
  colorDot: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.12 }] },
  applyRow: { flexDirection: 'row', gap: Spacing['2'] },
  applyChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, height: 42, borderRadius: Radius.lg,
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
  iconOption: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], height: 52, borderRadius: Radius.xl,
  },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
