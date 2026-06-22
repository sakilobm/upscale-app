/**
 * @file ledger.tsx
 * @architecture Presentation Layer — View Shell (Expo Router tab entry)
 * @description Lean orchestration shell for the Ledger tab. Delegates all state,
 *   filtering, section-building, and event handling to useLedgerScreen. Renders
 *   imported components only — contains zero business logic or inline calculations.
 * @associatedFiles
 *   src/features/ledger/hooks/useLedgerScreen.ts,
 *   src/features/ledger/components/LedgerInfoSheet.tsx,
 *   src/features/ledger/components/LedgerEmptyState.tsx,
 *   src/features/ledger/components/LedgerEntrySheet.tsx
 */

import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { AppHeader } from '@components/AppHeader';
import { FAB } from '@components/FAB';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Layout, Radius } from '@constants/Dimensions';
import { useLedgerScreen } from '@features/ledger/hooks/useLedgerScreen';
import { SegmentedControl } from '@features/ledger/components/SegmentedControl';
import { SettleUpHero } from '@features/ledger/components/SettleUpHero';
import { PersonLedgerCard } from '@features/ledger/components/PersonLedgerCard';
import { DebtHorizonStack } from '@features/ledger/components/DebtHorizonStack';
import { LedgerEntrySheet } from '@features/ledger/components/LedgerEntrySheet';
import { AddLoanSheet } from '@features/ledger/components/AddLoanSheet';
import { LoanInfoSheet } from '@features/ledger/components/LoanInfoSheet';
import { LedgerInfoSheet } from '@features/ledger/components/LedgerInfoSheet';
import { LedgerEmptyState } from '@features/ledger/components/LedgerEmptyState';
import type { LedgerTab } from '@features/ledger/types';

// ─── Segment definitions ─────────────────────────────────────────────────────

const SEGMENTS: { key: LedgerTab; label: string }[] = [
  { key: 'owed_to_me', label: 'Owed to Me' },
  { key: 'i_owe', label: 'I Owe' },
  { key: 'loans', label: 'Loans' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LedgerScreen() {
  const { colors, isDark } = useTheme();

  const {
    activeTab, setActiveTab,
    sheetVisible, sheetMode, sheetEntry,
    infoEntry, loanSheetVisible, infoLoan, editLoan,
    totalOwedToMe, totalIOwe,
    loans, sections, activeEntries,
    openAddSheet, openPartialSheet, closeSheet,
    openInfoSheet, closeInfoSheet, openLoanSheet, closeLoanSheet,
    openLoanInfoSheet, closeLoanInfoSheet, openEditLoanSheet,
    handleAddEntry, handleSettle, handleAddLoan, handleEditLoan,
    deleteEntry, addPartialReturn, recordPayment, deleteLoan,
    handleToggleReminder,
  } = useLedgerScreen();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background.primary }]} edges={['top']}>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: Layout.tabBarHeight + Spacing['20'] }]}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Ledger"
          subtitle="Hand-to-hand money tracker"
          screenLabel="People & Loans"
          chipLabel={activeEntries.length + loans.length > 0 ? `${activeEntries.length + loans.length} entries` : undefined}
          chipIcon={activeEntries.length + loans.length > 0 ? 'people-outline' : undefined}
          noPadding
        />

        <SettleUpHero totalOwedToMe={totalOwedToMe} totalIOwe={totalIOwe} />

        <View style={s.segmentWrapper}>
          <SegmentedControl
            segments={SEGMENTS as { key: string; label: string }[]}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as LedgerTab)}
          />
        </View>

        {/* Swipe hint */}
        {activeTab !== 'loans' && activeEntries.length > 0 && (
          <View style={[s.swipeHint, {
            backgroundColor: colors.glass.background,
            borderColor: colors.glass.border,
          }]}>
            <Ionicons name="arrow-back-outline" size={13} color={colors.text.tertiary} />
            <AppText variant="caption" color={colors.text.tertiary} style={{ fontWeight: '500', fontSize: 11 }}>
              Swipe left to settle or delete · Tap for details
            </AppText>
          </View>
        )}

        {/* Main content */}
        {activeTab === 'loans' ? (
          <View style={s.loansSection}>
            {loans.length === 0
              ? <LedgerEmptyState variant="loans" />
              : (
                <DebtHorizonStack
                  loans={loans}
                  onRecordPayment={recordPayment}
                  onPressCard={openLoanInfoSheet}
                />
              )
            }
          </View>
        ) : sections.length === 0 ? (
          <LedgerEmptyState variant={activeTab} />
        ) : (
          <View style={s.listSection}>
            {sections.map((section) => (
              <View key={section.title} style={s.sectionBlock}>
                <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionLabel}>
                  {section.title.toUpperCase()}
                </AppText>
                {section.data.map((entry) => (
                  <PersonLedgerCard
                    key={entry.id}
                    entry={entry}
                    onPress={openInfoSheet}
                    onSettle={deleteEntry}
                    onDelete={deleteEntry}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Entry / partial-return sheet */}
      <LedgerEntrySheet
        visible={sheetVisible}
        mode={sheetMode}
        editEntry={sheetEntry}
        defaultDirection={activeTab === 'i_owe' ? 'I_OWE' : 'OWED_TO_ME'}
        onClose={closeSheet}
        onAdd={handleAddEntry}
        onPartialReturn={addPartialReturn}
      />

      {/* Add loan sheet */}
      <AddLoanSheet
        visible={loanSheetVisible}
        onClose={closeLoanSheet}
        onAdd={handleAddLoan}
        editLoan={editLoan}
        onEdit={handleEditLoan}
      />

      {/* Detail info sheet */}
      <LedgerInfoSheet
        entry={infoEntry}
        onClose={closeInfoSheet}
        onPartialReturn={openPartialSheet}
        onSettle={handleSettle}
      />

      {/* Loan detail info sheet */}
      <LoanInfoSheet
        loan={infoLoan}
        onClose={closeLoanInfoSheet}
        onRecordPayment={recordPayment}
        onDelete={deleteLoan}
        onEdit={openEditLoanSheet}
        onToggleReminder={handleToggleReminder}
      />

      <FAB
        icon="add"
        label={activeTab === 'loans' ? "Add Loan" : "Add Entry"}
        onPress={activeTab === 'loans' ? openLoanSheet : openAddSheet}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['2'] },

  segmentWrapper: { marginBottom: Spacing['5'] },
  loansSection: { marginTop: Spacing['2'] },
  listSection: { gap: Spacing['4'] },
  sectionBlock: { gap: Spacing['2'] },
  sectionLabel: { fontSize: 11, letterSpacing: 1, marginBottom: Spacing['1'] },

  swipeHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing['3'], paddingVertical: Spacing['2'],
    borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing['5'],
  },
});
