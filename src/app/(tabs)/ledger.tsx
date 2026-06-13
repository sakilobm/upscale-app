import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { AppHeader } from '@components/AppHeader';
import { EmptyState } from '@components/EmptyState';
import { FAB } from '@components/FAB';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Layout, Radius } from '@constants/Dimensions';
import { useLedger } from '@features/ledger/hooks/useLedger';
import { useLoans } from '@features/ledger/hooks/useLoans';
import { SegmentedControl } from '@features/ledger/components/SegmentedControl';
import { SettleUpHero } from '@features/ledger/components/SettleUpHero';
import { PersonLedgerCard } from '@features/ledger/components/PersonLedgerCard';
import { DebtHorizonStack } from '@features/ledger/components/DebtHorizonStack';
import { LedgerEntrySheet } from '@features/ledger/components/LedgerEntrySheet';
import type { LedgerEntry } from '@store/ledgerStore';
import type { LedgerTab } from '@features/ledger/types';

const SEGMENTS = [
  { key: 'owed_to_me', label: 'Owed to Me' },
  { key: 'i_owe', label: 'I Owe' },
  { key: 'loans', label: 'Loans' },
] as const;

type SheetMode = 'add' | 'partial';

// ─── Entry Info Sheet ─────────────────────────────────────────────────────────

function LedgerInfoSheet({
  entry,
  onClose,
  onPartialReturn,
  onSettle,
}: {
  entry:           LedgerEntry | undefined;
  onClose:         () => void;
  onPartialReturn: (e: LedgerEntry) => void;
  onSettle:        (id: string) => void;
}) {
  const { colors, isDark } = useTheme();
  const translateY = useSharedValue(600);
  const backdropOp = useSharedValue(0);
  const visible    = !!entry;

  useEffect(() => {
    if (visible) {
      backdropOp.value = withTiming(1, { duration: 220 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 160, mass: 0.9 });
    } else {
      backdropOp.value = withTiming(0, { duration: 180 });
      translateY.value = withSpring(600, { damping: 20, stiffness: 200 });
    }
  }, [visible]);

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));

  if (!entry) return null;

  const remaining  = entry.totalAmount - entry.amountReturned;
  const progressPct = entry.totalAmount > 0 ? entry.amountReturned / entry.totalAmount : 0;
  const dirColor   = entry.direction === 'OWED_TO_ME' ? colors.status.income : colors.status.expense;
  const statusColor =
    entry.status === 'SETTLED' ? colors.status.income :
    entry.status === 'OVERDUE' ? colors.status.expense : colors.status.info;

  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';
  const stats  = [
    { label: 'Total',     value: entry.totalAmount,      color: colors.text.primary },
    { label: 'Returned',  value: entry.amountReturned,   color: colors.status.income },
    { label: 'Remaining', value: remaining,              color: remaining > 0 ? dirColor : colors.status.income },
  ];

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }, backdropStyle]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.infoSheet,
          { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          sheetStyle,
        ]}
      >
        {/* Handle */}
        <View style={[styles.infoHandle, { backgroundColor: colors.text.tertiary + '40' }]} />

        {/* Close */}
        <Pressable onPress={onClose} hitSlop={12} style={styles.infoClose}>
          <Ionicons name="close" size={20} color={colors.text.tertiary} />
        </Pressable>

        {/* Avatar + name row */}
        <View style={styles.infoAvatarRow}>
          <View style={[styles.infoAvatar, { backgroundColor: entry.personColor + '28', borderColor: entry.personColor + '55' }]}>
            <AppText style={[styles.infoAvatarText, { color: entry.personColor }]}>
              {entry.personInitials}
            </AppText>
          </View>
          <View style={styles.infoNameBlock}>
            <AppText variant="headingSM" color={colors.text.primary} style={styles.infoName}>
              {entry.personName}
            </AppText>
            <View style={styles.infoChipRow}>
              <View style={[styles.infoDirectionChip, { backgroundColor: dirColor + '18', borderColor: dirColor + '40' }]}>
                <Ionicons
                  name={entry.direction === 'OWED_TO_ME' ? 'arrow-down' : 'arrow-up'}
                  size={11}
                  color={dirColor}
                />
                <AppText style={[styles.infoChipText, { color: dirColor }]}>
                  {entry.direction === 'OWED_TO_ME' ? 'Owed to me' : 'I owe'}
                </AppText>
              </View>
              <View style={[styles.infoStatusChip, { backgroundColor: statusColor + '18' }]}>
                <AppText style={[styles.infoChipText, { color: statusColor }]}>
                  {entry.status === 'SETTLED' ? 'Settled' : entry.status === 'OVERDUE' ? 'Overdue' : 'Active'}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsCard, { backgroundColor: isDark ? colors.background.primary : colors.background.tertiary, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <AppText style={[styles.statValue, { color: s.color }]}>
                ${s.value.toFixed(2)}
              </AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={styles.statLabel}>
                {s.label}
              </AppText>
            </View>
          ))}
        </View>

        {/* Progress bar (if partial) */}
        {progressPct > 0 && progressPct < 1 && (
          <View style={[styles.infoProgressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <View
              style={[styles.infoProgressFill, { width: `${progressPct * 100}%` as any, backgroundColor: entry.personColor }]}
            />
          </View>
        )}

        {/* Meta */}
        {(entry.note || entry.dueDate) && (
          <View style={styles.infoMeta}>
            {entry.note && (
              <View style={styles.infoMetaRow}>
                <Ionicons name="chatbubble-outline" size={13} color={colors.text.tertiary} />
                <AppText variant="caption" color={colors.text.secondary}>{entry.note}</AppText>
              </View>
            )}
            {entry.dueDate && (
              <View style={styles.infoMetaRow}>
                <Ionicons name="calendar-outline" size={13} color={colors.text.tertiary} />
                <AppText variant="caption" color={colors.text.secondary}>Due {entry.dueDate}</AppText>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        {entry.status !== 'SETTLED' && (
          <View style={styles.infoActions}>
            {remaining > 0 && (
              <Pressable
                onPress={() => { onClose(); onPartialReturn(entry); }}
                style={[styles.infoActionBtn, styles.infoActionPrimary, { overflow: 'hidden' }]}
              >
                <LinearGradient
                  colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="return-down-back-outline" size={16} color="#fff" />
                <AppText style={styles.infoActionPrimaryText}>Record Partial Return</AppText>
              </Pressable>
            )}
            <Pressable
              onPress={() => { onClose(); onSettle(entry.id); }}
              style={[styles.infoActionBtn, styles.infoActionSecondary, { borderColor: colors.status.income + '50', backgroundColor: colors.status.income + '10' }]}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.status.income} />
              <AppText style={[styles.infoActionSecondaryText, { color: colors.status.income }]}>
                Mark as Settled
              </AppText>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LedgerScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<LedgerTab>('owed_to_me');

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('add');
  const [sheetEntry, setSheetEntry] = useState<LedgerEntry | undefined>();

  // Info sheet state — tap a card to see details
  const [infoEntry, setInfoEntry] = useState<LedgerEntry | undefined>();

  const {
    entries: owedToMeEntries,
    totalOwedToMe,
    totalIOwe,
    addEntry,
    addPartialReturn,
    settleEntry,
    deleteEntry,
  } = useLedger();

  const { loans, recordPayment } = useLoans();

  const directionEntries = activeTab === 'owed_to_me'
    ? owedToMeEntries.filter((e) => e.direction === 'OWED_TO_ME')
    : activeTab === 'i_owe'
      ? owedToMeEntries.filter((e) => e.direction === 'I_OWE')
      : [];

  const activeEntries  = directionEntries.filter((e) => e.status !== 'SETTLED');
  const settledEntries = directionEntries.filter((e) => e.status === 'SETTLED');

  const openAddSheet = () => {
    setSheetMode('add');
    setSheetEntry(undefined);
    setSheetVisible(true);
  };

  const openPartialSheet = (entry: LedgerEntry) => {
    setSheetMode('partial');
    setSheetEntry(entry);
    setSheetVisible(true);
  };

  // Tap a card → open info sheet (not partial return directly)
  const handleCardPress = (entry: LedgerEntry) => {
    setInfoEntry(entry);
  };

  const sections = [
    ...(activeEntries.length > 0  ? [{ title: 'Active',  data: activeEntries  }] : []),
    ...(settledEntries.length > 0  ? [{ title: 'Settled', data: settledEntries }] : []),
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <AppHeader
        title="Ledger"
        subtitle="Hand-to-hand money tracker"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Layout.tabBarHeight + Spacing['8'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Settle Up Hero */}
        <SettleUpHero
          totalOwedToMe={totalOwedToMe}
          totalIOwe={totalIOwe}
        />

        {/* Segmented Control */}
        <View style={styles.segmentWrapper}>
          <SegmentedControl
            segments={SEGMENTS as unknown as { key: string; label: string }[]}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as LedgerTab)}
          />
        </View>

        {/* Swipe hint — visible only on owed_to_me / i_owe tabs with active entries */}
        {activeTab !== 'loans' && activeEntries.length > 0 && (
          <View style={[styles.swipeHint, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)' }]}>
            <Ionicons name="arrow-back-outline" size={13} color={colors.text.tertiary} />
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '500', fontSize: 11 }}>
              Swipe left to settle or delete · Tap for details
            </AppText>
          </View>
        )}

        {activeTab === 'loans' ? (
          <View style={styles.loansSection}>
            {loans.length === 0 ? (
              <EmptyState
                emoji="🏦"
                title="No active loans"
                subtitle="Track mortgages, car loans, or money you've lent"
              />
            ) : (
              <View style={styles.debtStack}>
                <DebtHorizonStack loans={loans} onRecordPayment={recordPayment} />
              </View>
            )}
          </View>
        ) : sections.length === 0 ? (
          <EmptyState
            emoji={activeTab === 'owed_to_me' ? '🤝' : '💸'}
            title={activeTab === 'owed_to_me' ? 'No one owes you' : 'You\'re debt-free'}
            subtitle="Tap + to record a hand-to-hand transaction"
          />
        ) : (
          <View style={styles.listSection}>
            {sections.map((section) => (
              <View key={section.title} style={styles.sectionBlock}>
                <AppText
                  variant="labelSM"
                  color={colors.text.tertiary}
                  style={styles.sectionLabel}
                >
                  {section.title.toUpperCase()}
                </AppText>
                {section.data.map((entry) => (
                  <PersonLedgerCard
                    key={entry.id}
                    entry={entry}
                    onPress={handleCardPress}
                    onSettle={settleEntry}
                    onDelete={deleteEntry}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Entry / Partial Return Sheet */}
      <LedgerEntrySheet
        visible={sheetVisible}
        mode={sheetMode}
        editEntry={sheetEntry}
        onClose={() => setSheetVisible(false)}
        onAdd={(data) => {
          addEntry({
            ...data,
            personInitials: data.personName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
            personColor: '#6C63FF',
            date: new Date().toISOString().slice(0, 10),
          });
        }}
        onPartialReturn={addPartialReturn}
      />

      {/* Card detail / actions sheet */}
      <LedgerInfoSheet
        entry={infoEntry}
        onClose={() => setInfoEntry(undefined)}
        onPartialReturn={openPartialSheet}
        onSettle={(id) => { settleEntry(id); setInfoEntry(undefined); }}
      />

      {/* FAB */}
      <FAB icon="add" label="Add Entry" onPress={openAddSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['2'],
  },
  segmentWrapper: {
    marginBottom: Spacing['5'],
  },
  loansSection: {
    marginTop: Spacing['2'],
  },
  debtStack: {
    gap: Spacing['3'],
  },
  listSection: {
    gap: Spacing['4'],
  },
  sectionBlock: {
    gap: Spacing['2'],
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: Spacing['1'],
  },
  swipeHint: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: Spacing['3'],
    paddingVertical:   Spacing['2'],
    borderRadius:      Radius.lg,
    borderWidth:       1,
    marginBottom:      Spacing['1'],
  },

  // ── Info Sheet ──────────────────────────────────────────────────────────────
  infoSheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderWidth:          1,
    borderBottomWidth:    0,
    paddingHorizontal:    Spacing['5'],
    paddingBottom:        Platform.OS === 'ios' ? 40 : 28,
    gap:                  Spacing['4'],
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.14, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  infoHandle: {
    alignSelf:    'center',
    width:        36,
    height:       4,
    borderRadius: 2,
    marginTop:    12,
  },
  infoClose: {
    position: 'absolute',
    top:      16,
    right:    Spacing['5'],
  },
  infoAvatarRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['3'],
    marginTop:     Spacing['1'],
  },
  infoAvatar: {
    width:          52,
    height:         52,
    borderRadius:   26,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  infoAvatarText: {
    fontSize:   18,
    fontWeight: '700',
  },
  infoNameBlock: {
    flex: 1,
    gap:  6,
  },
  infoName: {
    fontSize:   20,
    fontWeight: '700',
  },
  infoChipRow: {
    flexDirection: 'row',
    gap:           8,
    alignItems:    'center',
    flexWrap:      'wrap',
  },
  infoDirectionChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: 9,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  infoStatusChip: {
    paddingHorizontal: 9,
    paddingVertical:   3,
    borderRadius:      Radius.full,
  },
  infoChipText: {
    fontSize:   11,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection:  'row',
    borderRadius:   Radius.xl,
    borderWidth:    1,
    overflow:       'hidden',
  },
  statCell: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: Spacing['4'],
    gap:             4,
  },
  statValue: {
    fontSize:   16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  infoProgressTrack: {
    height:       4,
    borderRadius: 2,
    overflow:     'hidden',
  },
  infoProgressFill: {
    height:       4,
    borderRadius: 2,
  },
  infoMeta: {
    gap: Spacing['2'],
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  infoActions: {
    gap: Spacing['3'],
    marginTop: Spacing['1'],
  },
  infoActionBtn: {
    height:         52,
    borderRadius:   Radius.xl,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
  },
  infoActionPrimary: {},
  infoActionPrimaryText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   15,
  },
  infoActionSecondary: {
    borderWidth: 1,
  },
  infoActionSecondaryText: {
    fontWeight: '600',
    fontSize:   15,
  },
});
