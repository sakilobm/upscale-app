/**
 * @file BackupSyncSheet.tsx
 * @architecture Presentation Layer — UI Component
 * @description Bottom-sheet content for managing full-fledged Backup & Sync.
 *   Provides manual/automatic cloud sync simulations, full JSON database exports
 *   via native sharing, and custom JSON imports to restore all Zustand stores live.
 * @associatedFiles src/app/(tabs)/profile.tsx, src/features/profile/hooks/useProfileScreen.ts
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Switch, TextInput, Share, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';
import { toast } from '@store/toastStore';

// Import all Zustand stores
import { useAccountStore } from '@store/accountStore';
import { useTransactionStore } from '@store/transactionStore';
import { useCategoryStore } from '@store/categoryStore';
import { usePlannedPaymentsStore } from '@store/plannedPaymentsStore';
import { useBudgetStore } from '@store/budgetStore';
import { useLoansStore } from '@store/loansStore';
import { useLedgerStore } from '@store/ledgerStore';
import { usePreferencesStore } from '@store/preferencesStore';

interface Props {
  onClose: () => void;
}

type SyncStep = 'idle' | 'auth' | 'upload' | 'verify' | 'done';

const SYNC_STEPS: Record<SyncStep, string> = {
  idle:    'Ready to Sync',
  auth:    'Securing cloud tunnel...',
  upload:  'Uploading database blocks...',
  verify:  'Verifying data integrity...',
  done:    'Sync complete!',
};

export function BackupSyncSheet({ onClose }: Props) {
  const { colors, isDark } = useTheme();

  // Local settings & sync states
  const [autoSync, setAutoSync] = useState(true);
  const [syncState, setSyncState] = useState<SyncStep>('idle');
  const [lastSynced, setLastSynced] = useState<string>('Today, 9:15 PM');
  const [showRestoreArea, setShowRestoreArea] = useState(false);
  const [restorePayload, setRestorePayload] = useState('');

  // Collect stats from stores
  const accountsCount = useAccountStore((s) => s.accounts.length);
  const txsCount      = useTransactionStore((s) => s.transactions.length);
  const catsCount     = useCategoryStore((s) => s.categories.length);
  const budgetsCount  = useBudgetStore((s) => s.budgets.length);
  const loansCount    = useLoansStore((s) => s.loans.length);
  const ledgerCount   = useLedgerStore((s) => s.entries.length);

  // Trigger manual simulated sync
  const handleSyncNow = () => {
    if (syncState !== 'idle') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSyncState('auth');
  };

  useEffect(() => {
    if (syncState === 'idle') return;
    if (syncState === 'auth') {
      const t = setTimeout(() => setSyncState('upload'), 1000);
      return () => clearTimeout(t);
    }
    if (syncState === 'upload') {
      const t = setTimeout(() => setSyncState('verify'), 1200);
      return () => clearTimeout(t);
    }
    if (syncState === 'verify') {
      const t = setTimeout(() => setSyncState('done'), 800);
      return () => clearTimeout(t);
    }
    if (syncState === 'done') {
      const t = setTimeout(() => {
        setSyncState('idle');
        const now = new Date();
        setLastSynced(`Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.success('Database successfully synced with WhereKash Cloud!');
      }, 500);
      return () => clearTimeout(t);
    }
  }, [syncState]);

  // Export full JSON backup
  const handleExportBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const backupData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        accounts: useAccountStore.getState().accounts,
        transactions: useTransactionStore.getState().transactions,
        categories: useCategoryStore.getState().categories,
        payments: usePlannedPaymentsStore.getState().payments,
        budgets: useBudgetStore.getState().budgets,
        loans: useLoansStore.getState().loans,
        ledger: useLedgerStore.getState().entries,
        preferences: {
          hapticLevel: usePreferencesStore.getState().hapticLevel,
          notifPrefs: usePreferencesStore.getState().notifPrefs,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      await Share.share({
        message: `WHEREKASH_BACKUP_DATA:\n${jsonStr}`,
        title: 'WhereCash Database Backup',
      });
      toast.success('Backup data compiled and shared!');
    } catch (err) {
      toast.error('Failed to create backup export file.');
      console.error(err);
    }
  };

  // Restore state from pasted JSON string
  const handleRestoreBackup = () => {
    if (!restorePayload.trim()) {
      toast.error('Please paste a backup JSON payload first');
      return;
    }

    try {
      // Clean string prefix if shared via React Native Share format
      let cleanString = restorePayload.trim();
      const prefix = 'WHEREKASH_BACKUP_DATA:\n';
      if (cleanString.startsWith(prefix)) {
        cleanString = cleanString.slice(prefix.length);
      }

      const backup = JSON.parse(cleanString);

      // Validate required database nodes
      if (
        !backup.accounts ||
        !backup.transactions ||
        !backup.categories ||
        !backup.payments
      ) {
        toast.error('Invalid backup payload format. Missing core tables.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Update all stores live
      useAccountStore.setState({ accounts: backup.accounts });
      useTransactionStore.setState({ transactions: backup.transactions });
      useCategoryStore.setState({ categories: backup.categories });
      usePlannedPaymentsStore.setState({ payments: backup.payments });
      
      if (backup.budgets) useBudgetStore.setState({ budgets: backup.budgets });
      if (backup.loans) useLoansStore.setState({ loans: backup.loans });
      if (backup.ledger) useLedgerStore.setState({ entries: backup.ledger });
      
      if (backup.preferences) {
        usePreferencesStore.setState({
          hapticLevel: backup.preferences.hapticLevel ?? 'medium',
          notifPrefs:  backup.preferences.notifPrefs,
        });
      }

      toast.success('All stores restored from local backup!');
      setShowRestoreArea(false);
      setRestorePayload('');
      onClose();
    } catch (err) {
      toast.error('JSON parsing failed. Ensure backup text is complete.');
      console.error(err);
    }
  };

  const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
  const activeBg = colors.brand.primary + '12';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      
      {/* SECTION 1: CLOUD BACKUP & SYNCHRONIZATION */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          CLOUD SYNCHRONIZATION
        </AppText>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
          
          {/* Status Row */}
          <View style={[s.row, s.borderBottom, { borderBottomColor: colors.glass.border }]}>
            <View style={[s.iconBox, { backgroundColor: colors.status.income + '18', borderColor: colors.status.income + '30' }]}>
              <Ionicons name="cloud-done-outline" size={16} color={colors.status.income} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>Cloud Backup Status</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Last Synced: {lastSynced}</AppText>
            </View>
            <View style={[s.badge, { backgroundColor: colors.status.income + '15' }]}>
              <AppText style={{ color: colors.status.income, fontSize: 10, fontWeight: '700' }}>SECURE</AppText>
            </View>
          </View>

          {/* Automatic Sync Switch */}
          <View style={[s.row, s.borderBottom, { borderBottomColor: colors.glass.border }]}>
            <View style={[s.iconBox, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '30' }]}>
              <Ionicons name="sync-outline" size={16} color={colors.brand.primary} />
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>Auto-Background Sync</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Auto-sync changes silently in the background</AppText>
            </View>
            <Switch
              value={autoSync}
              onValueChange={setAutoSync}
              trackColor={{ false: colors.glass.backgroundMid, true: colors.brand.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.glass.backgroundMid}
            />
          </View>

          {/* Sync Trigger button */}
          <View style={s.syncActionArea}>
            {syncState !== 'idle' ? (
              <View style={s.syncingStateRow}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <AppText variant="labelMD" color={colors.brand.primary} style={{ fontWeight: '600' }}>
                  {SYNC_STEPS[syncState]}
                </AppText>
              </View>
            ) : (
              <Pressable
                onPress={handleSyncNow}
                style={({ pressed }) => [
                  s.syncBtn,
                  {
                    backgroundColor: colors.brand.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="refresh-outline" size={16} color={colors.white} />
                <AppText style={[s.syncBtnText, { color: colors.white }]}>Sync Database Now</AppText>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* SECTION 2: APP DATABASE STATS */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          LOCAL DATABASE STATISTICS
        </AppText>
        <View style={[s.statsGrid, { gap: Spacing['2'] }]}>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Transactions</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{txsCount}</AppText>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Accounts</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{accountsCount}</AppText>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Categories</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{catsCount}</AppText>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Limits & Budgets</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{budgetsCount}</AppText>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Active Loans</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{loansCount}</AppText>
          </View>
          <View style={[s.statCard, { backgroundColor: cardBg, borderColor: colors.glass.border }]}>
            <AppText variant="caption" color={colors.text.tertiary}>Ledgers</AppText>
            <AppText variant="headingMD" color={colors.text.primary} style={{ fontWeight: '700' }}>{ledgerCount}</AppText>
          </View>
        </View>
      </View>

      {/* SECTION 3: LOCAL EXPORT & IMPORT */}
      <View style={s.section}>
        <AppText variant="labelSM" color={colors.text.tertiary} style={s.sectionTitle}>
          MANUAL EXPORT / RESTORE
        </AppText>
        <View style={s.exportActions}>
          <Pressable
            onPress={handleExportBackup}
            style={({ pressed }) => [
              s.actionBtn,
              {
                backgroundColor: cardBg,
                borderColor:     colors.glass.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="download-outline" size={18} color={colors.text.primary} />
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>Create Backup File</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Compile all tables into a secure JSON</AppText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowRestoreArea(!showRestoreArea);
            }}
            style={({ pressed }) => [
              s.actionBtn,
              {
                backgroundColor: cardBg,
                borderColor:     colors.glass.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={18} color={colors.status.warning} />
            <View style={{ flex: 1, gap: 1 }}>
              <AppText variant="labelLG" color={colors.text.primary}>Restore from File</AppText>
              <AppText variant="caption" color={colors.text.tertiary}>Overwrite local stores with JSON data</AppText>
            </View>
          </Pressable>

          {/* Paste Restore Section */}
          {showRestoreArea && (
            <View style={[s.restoreCard, { borderColor: colors.status.warning + '50', backgroundColor: colors.status.warning + '05' }]}>
              <View style={{ flexDirection: 'row', gap: Spacing['2'], alignItems: 'center', marginBottom: Spacing['2'] }}>
                <Ionicons name="alert-circle" size={14} color={colors.status.warning} />
                <AppText style={{ fontSize: 11, fontWeight: '700', color: colors.status.warning }}>RESTORE WARNING</AppText>
              </View>
              <AppText variant="caption" color={colors.text.secondary} style={{ marginBottom: Spacing['3'] }}>
                Restoring will COMPLETELY overwrite all existing accounts, categories, budgets, and transaction records. Paste the JSON compile text below:
              </AppText>
              
              <TextInput
                multiline
                numberOfLines={6}
                value={restorePayload}
                onChangeText={setRestorePayload}
                placeholder="Paste backup JSON text here..."
                placeholderTextColor={colors.text.tertiary}
                style={[
                  s.restoreInput,
                  {
                    color: colors.text.primary,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: colors.glass.border,
                  },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Pressable
                onPress={handleRestoreBackup}
                style={({ pressed }) => [
                  s.restoreSubmitBtn,
                  {
                    backgroundColor: colors.status.warning,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={14} color={colors.white} />
                <AppText style={[s.restoreSubmitBtnText, { color: colors.white }]}>Verify & Overwrite Data</AppText>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Spacing['2'],
  },
  content: {
    paddingHorizontal: Spacing['5'],
    paddingBottom: Spacing['8'],
    gap: 18,
  },
  section: {
    gap: Spacing['2'],
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 9.5,
    letterSpacing: 1,
    paddingLeft: 4,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'] + 2,
    gap: Spacing['3'],
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  syncActionArea: {
    padding: Spacing['4'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncingStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing['3'] + 1,
    borderRadius: Radius.lg,
    gap: Spacing['2'],
  },
  syncBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '31.5%',
    paddingVertical: Spacing['3'],
    paddingHorizontal: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
  },
  exportActions: {
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 14,
  },
  restoreCard: {
    padding: Spacing['4'],
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 8,
    marginTop: 2,
  },
  restoreInput: {
    fontFamily: Platform.select({ ios: 'CourierNewPSMT', android: 'monospace' }),
    fontSize: 11,
    height: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top',
  },
  restoreSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3'],
    borderRadius: Radius.lg,
    gap: Spacing['2'],
    marginTop: 4,
  },
  restoreSubmitBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
});
