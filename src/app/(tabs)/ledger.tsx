import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { AppHeader, HeaderIconBtn } from '@components/AppHeader';
import { EmptyState } from '@components/EmptyState';
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

export default function LedgerScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<LedgerTab>('owed_to_me');

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>('add');
  const [sheetEntry, setSheetEntry] = useState<LedgerEntry | undefined>();

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

  const activeEntries = directionEntries.filter((e) => e.status !== 'SETTLED');
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

  const handleCardPress = (entry: LedgerEntry) => {
    if (entry.status !== 'SETTLED') {
      openPartialSheet(entry);
    }
  };

  const sections = [
    ...(activeEntries.length > 0 ? [{ title: 'Active', data: activeEntries }] : []),
    ...(settledEntries.length > 0 ? [{ title: 'Settled', data: settledEntries }] : []),
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
        rightNode={
          <HeaderIconBtn icon="add" onPress={openAddSheet} />
        }
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

        {/* Tab Content */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['2'],
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
});
