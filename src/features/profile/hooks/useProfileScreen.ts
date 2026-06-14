/**
 * @file useProfileScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Encapsulates ALL state for the Profile screen: bottom-sheet visibility,
 *   confirm-modal visibility, notification preferences, security preferences, and
 *   wraps business operations from useProfile with sheet-closing side-effects.
 *   The View layer receives a typed contract and owns zero raw setState calls.
 * @associatedFiles src/features/profile/hooks/useProfile.ts, src/app/(tabs)/profile.tsx
 */

import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { toast } from '@store/toastStore';
import { useProfile } from './useProfile';
import type { CurrencyCode } from '@store/types';

// ─── Sub-contracts ────────────────────────────────────────────────────────────

export interface SheetHandle {
  isOpen: boolean;
  open:   () => void;
  close:  () => void;
}

export interface ConfirmHandle {
  isVisible: boolean;
  show:      () => void;
  dismiss:   () => void;
  confirm:   () => void;
}

export interface NotifPrefs {
  transactions: boolean;
  budgetAlerts: boolean;
  plannedPay:   boolean;
  weeklyReport: boolean;
}

export interface SecPrefs {
  biometric:   boolean;
  autoLock:    boolean;
  hideBalance: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfileScreen() {
  const {
    user, txCount, memberSince, initials,
    handleEditName, handleCurrencySelect: currencySelect,
    handleExport: exportData, handleBackup,
    handleClearAllData: clearAllData, handleSignOut,
  } = useProfile();

  // ── Sheet visibility ──
  const [currencySheet, setCurrencySheet] = useState(false);
  const [notifSheet,    setNotifSheet]    = useState(false);
  const [securitySheet, setSecuritySheet] = useState(false);
  const [exportSheet,   setExportSheet]   = useState(false);
  const [helpSheet,     setHelpSheet]     = useState(false);

  // ── Confirm dialogs ──
  const [signOutConfirm,   setSignOutConfirm]   = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);
  const [rateConfirm,      setRateConfirm]      = useState(false);

  // ── Local preferences (not persisted) ──
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    transactions: true, budgetAlerts: true, plannedPay: true, weeklyReport: false,
  });
  const [secPrefs, setSecPrefs] = useState<SecPrefs>({
    biometric: false, autoLock: true, hideBalance: false,
  });

  // ── Handlers that close sheets before delegating ──
  const handleSelectCurrency = useCallback((code: CurrencyCode) => {
    currencySelect(code);
    setCurrencySheet(false);
  }, [currencySelect]);

  const handleExport = useCallback(async (fmt: 'CSV' | 'JSON') => {
    setExportSheet(false);
    await exportData(fmt);
  }, [exportData]);

  const confirmSignOut = useCallback(() => {
    setSignOutConfirm(false);
    handleSignOut();
  }, [handleSignOut]);

  const confirmClearData = useCallback(async () => {
    setClearDataConfirm(false);
    await clearAllData();
  }, [clearAllData]);

  const confirmRate = useCallback(() => {
    setRateConfirm(false);
    toast.success('Thank you for your support! ⭐');
  }, []);

  return {
    data: { user, txCount, memberSince, initials },

    sheets: {
      currency: {
        isOpen: currencySheet,
        open:   () => setCurrencySheet(true),
        close:  () => setCurrencySheet(false),
      } satisfies SheetHandle,
      notifications: {
        isOpen: notifSheet,
        open:   () => setNotifSheet(true),
        close:  () => setNotifSheet(false),
      } satisfies SheetHandle,
      security: {
        isOpen: securitySheet,
        open:   () => setSecuritySheet(true),
        close:  () => setSecuritySheet(false),
      } satisfies SheetHandle,
      export: {
        isOpen: exportSheet,
        open:   () => setExportSheet(true),
        close:  () => setExportSheet(false),
      } satisfies SheetHandle,
      help: {
        isOpen: helpSheet,
        open:   () => setHelpSheet(true),
        close:  () => setHelpSheet(false),
      } satisfies SheetHandle,
    },

    confirms: {
      signOut: {
        isVisible: signOutConfirm,
        show:    () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setSignOutConfirm(true); },
        dismiss: () => setSignOutConfirm(false),
        confirm: confirmSignOut,
      } satisfies ConfirmHandle,
      clearData: {
        isVisible: clearDataConfirm,
        show:    () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setClearDataConfirm(true); },
        dismiss: () => setClearDataConfirm(false),
        confirm: confirmClearData,
      } satisfies ConfirmHandle,
      rate: {
        isVisible: rateConfirm,
        show:    () => setRateConfirm(true),
        dismiss: () => setRateConfirm(false),
        confirm: confirmRate,
      } satisfies ConfirmHandle,
    },

    preferences: {
      notifications: notifPrefs,
      security:      secPrefs,
      updateNotification: (key: keyof NotifPrefs, value: boolean) => {
        Haptics.selectionAsync();
        setNotifPrefs((p) => ({ ...p, [key]: value }));
      },
      updateSecurity: (key: keyof SecPrefs, value: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSecPrefs((p) => ({ ...p, [key]: value }));
      },
    },

    handlers: {
      editName:       handleEditName,
      selectCurrency: handleSelectCurrency,
      exportData:     handleExport,
      backup:         handleBackup,
    },
  };
}
