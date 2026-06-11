import { useState } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AppHeader, HeaderIconBtn } from '@components/AppHeader';
import { useBudgets } from '@features/budget/hooks/useBudgets';
import { ProgressRingMatrix } from '@features/budget/components/ProgressRingMatrix';
import { PlannedPaymentsTimeline } from '@features/budget/components/PlannedPaymentsTimeline';
import { GlassCard } from '@components/GlassCard';
import { AppText } from '@components/AppText';
import { ProgressBar } from '@components/ProgressBar';
import { EmptyState } from '@components/EmptyState';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { toast } from '@store/toastStore';
import { Spacing, Layout, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { TransactionCategory } from '@store/types';

// ─── Add Payment Sheet ────────────────────────────────────────────────────────

const CATEGORIES: { key: TransactionCategory; emoji: string; label: string }[] = [
  { key: 'housing',       emoji: '🏠', label: 'Housing' },
  { key: 'food',          emoji: '🍔', label: 'Food' },
  { key: 'transport',     emoji: '🚗', label: 'Transport' },
  { key: 'health',        emoji: '💊', label: 'Health' },
  { key: 'entertainment', emoji: '🎬', label: 'Fun' },
  { key: 'education',     emoji: '📚', label: 'Education' },
  { key: 'shopping',      emoji: '🛍', label: 'Shopping' },
  { key: 'other',         emoji: '📌', label: 'Other' },
];

interface AddPaymentSheetProps {
  visible:  boolean;
  onClose:  () => void;
  onSubmit: (data: {
    title:    string;
    amount:   number;
    dueDate:  string;
    category: TransactionCategory;
  }) => void;
}

function AddPaymentSheet({ visible, onClose, onSubmit }: AddPaymentSheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [title,    setTitle]    = useState('');
  const [amount,   setAmount]   = useState('');
  const [dueDate,  setDueDate]  = useState('');
  const [category, setCategory] = useState<TransactionCategory>('other');

  const scale = useSharedValue(0.86);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   scale.value,
  }));

  const handleShow = () => {
    scale.value = withSpring(1, { damping: 18, stiffness: 220 });
  };
  const handleHide = () => {
    scale.value = withSpring(0.86, { damping: 18, stiffness: 220 });
  };

  const reset = () => {
    setTitle(''); setAmount(''); setDueDate(''); setCategory('other');
  };

  const handleSubmit = () => {
    const parsed = parseFloat(amount);
    if (!title.trim())       { toast.error('Title is required');          return; }
    if (!parsed || parsed <= 0) { toast.error('Enter a valid amount');    return; }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      toast.error('Date format: YYYY-MM-DD'); return;
    }
    onSubmit({ title: title.trim(), amount: parsed, dueDate, category });
    reset();
    onClose();
  };

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';
  const inputBg = isDark ? colors.background.primary : '#F5F5F7';

  return (
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
            {
              backgroundColor: cardBg,
              paddingBottom: Math.max(insets.bottom, Spacing['5']),
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <AppText variant="headingSM" color={colors.text.primary}>Add Planned Payment</AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.text.tertiary} />
            </Pressable>
          </View>

          {/* Title */}
          <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>
            TITLE
          </AppText>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
            placeholder="e.g. Rent, Netflix, Insurance"
            placeholderTextColor={colors.text.tertiary}
            value={title}
            onChangeText={setTitle}
          />

          {/* Amount + Due Date row */}
          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>
                AMOUNT ($)
              </AppText>
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
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>
                DUE DATE
              </AppText>
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
          <AppText variant="labelSM" color={colors.text.tertiary} style={styles.fieldLabel}>
            CATEGORY
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catRow}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = cat.key === category;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isSelected ? colors.brand.primary + '20' : inputBg,
                      borderColor:     isSelected ? colors.brand.primary + '60' : 'transparent',
                      borderWidth:     1,
                    },
                  ]}
                >
                  <AppText style={{ fontSize: 16 }}>{cat.emoji}</AppText>
                  <AppText
                    variant="caption"
                    style={{ color: isSelected ? colors.brand.primary : colors.text.secondary }}
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
            <AppText
              variant="labelLG"
              style={{ color: isDark ? '#000' : '#FFFFFF', fontWeight: '700' }}
            >
              Add Payment
            </AppText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
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

  const overviewGradient: [string, string] =
    summary && summary.percentUsed > 100
      ? [colors.status.expense, colors.status.expense]
      : [colors.brand.primary, colors.brand.accent];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
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
        <AppHeader
          title="Budget"
          subtitle="Monthly spending limits"
          noPadding
          rightNode={
            <HeaderIconBtn icon="add" onPress={() => setAddVisible(true)} />
          }
        />

        {/* Monthly overview card */}
        {summary && (
          <GlassCard padding={Spacing['5']} borderRadius={Radius.xl} borderGlow style={styles.overviewCard}>
            <AppText variant="labelMD" color={colors.text.secondary}>Monthly Overview</AppText>
            <View style={styles.overviewRow}>
              <View>
                <AppText variant="numericLG" color={colors.text.primary}>
                  ${summary.totalSpent.toFixed(0)}
                </AppText>
                <AppText variant="caption" color={colors.text.secondary}>
                  of ${summary.totalLimit.toFixed(0)} total
                </AppText>
              </View>
              <View style={styles.overviewRight}>
                <AppText
                  variant="headingMD"
                  color={summary.percentUsed > 100 ? colors.status.expense : colors.status.income}
                >
                  {summary.percentUsed.toFixed(0)}%
                </AppText>
                {summary.overBudgetCount > 0 && (
                  <View style={[styles.overBudgetBadge, { backgroundColor: colors.status.expense + '20' }]}>
                    <AppText variant="caption" color={colors.status.expense}>
                      {summary.overBudgetCount} over budget
                    </AppText>
                  </View>
                )}
              </View>
            </View>
            <ProgressBar
              progress={Math.min(summary.percentUsed / 100, 1)}
              gradient={overviewGradient}
              height={8}
              style={styles.overviewBar}
            />
          </GlassCard>
        )}

        {/* Progress Ring Matrix */}
        {isLoading && !budgets.length ? (
          <ActivityIndicator color={colors.brand.primary} style={styles.loader} />
        ) : isEmpty ? (
          <EmptyState
            emoji="🎯"
            title="No budgets set"
            subtitle="Set spending limits to track your habits."
          />
        ) : (
          <ProgressRingMatrix budgets={budgets} />
        )}

        {/* Planned Payments Timeline */}
        <View style={styles.timelineWrapper}>
          <PlannedPaymentsTimeline
            payments={payments}
            onSettle={settlePayment}
            onDelete={deletePayment}
          />
        </View>
      </ScrollView>

      <AddPaymentSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onSubmit={({ title, amount, dueDate, category }) => {
          addPayment({ title, amount, dueDate, category, isRecurring: false });
          toast.success(`"${title}" added to planned payments`);
        }}
      />
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
  overviewRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginVertical: Spacing['3'],
  },
  overviewRight: { alignItems: 'flex-end', gap: 4 },
  overBudgetBadge: {
    paddingHorizontal: 8,
    paddingVertical:   2,
    borderRadius:      999,
  },
  overviewBar:     { marginTop: Spacing['2'] },
  loader:          { marginTop: Spacing['10'] },
  timelineWrapper: {},

  // Sheet
  sheetOuter: {
    flex:           1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius:  Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal:    Spacing['5'],
    paddingTop:           Spacing['3'],
    gap:                  Spacing['3'],
    ...Platform.select({
      ios: {
        shadowColor:   '#000',
        shadowOffset:  { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius:  20,
      },
      android: { elevation: 20 },
    }),
  },
  handle: {
    alignSelf:    'center',
    width:        36,
    height:       4,
    borderRadius: 2,
    marginBottom: Spacing['2'],
  },
  sheetHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  fieldLabel: {
    fontSize:      10,
    letterSpacing: 0.8,
    marginBottom:  -Spacing['1'],
  },
  input: {
    height:            46,
    borderRadius:      Radius.lg,
    paddingHorizontal: Spacing['4'],
    fontSize:          15,
  },
  rowFields: {
    flexDirection: 'row',
    gap:           Spacing['3'],
  },
  catRow: {
    gap: Spacing['2'],
  },
  catChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: Spacing['3'],
    paddingVertical:   8,
    borderRadius:      Radius.lg,
  },
  submitBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing['2'],
    height:            52,
    borderRadius:      Radius.xl,
    marginTop:         Spacing['2'],
  },
});
