import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type HapticLevel = 'off' | 'soft' | 'light' | 'medium' | 'heavy';

export interface NotifPrefs {
  transactions: boolean;
  budgetAlerts: boolean;
  plannedPay:   boolean;
  weeklyReport: boolean;
  quietHours:   boolean;
  minAlertAmount: number;
  channels: 'push' | 'email' | 'both';
  smartInsights: boolean;
}

const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  transactions: true,
  budgetAlerts: true,
  plannedPay: true,
  weeklyReport: false,
  quietHours: false,
  minAlertAmount: 0,
  channels: 'both',
  smartInsights: true,
};

interface PreferencesState {
  hapticLevel: HapticLevel;
  hapticsEnabledOnboarding: boolean;
  hapticsEnabledButtonTaps: boolean;
  hapticsEnabledActions: boolean;
  notifPrefs: NotifPrefs;
  setHapticLevel: (level: HapticLevel) => void;
  setHapticsEnabledOnboarding: (enabled: boolean) => void;
  setHapticsEnabledButtonTaps: (enabled: boolean) => void;
  setHapticsEnabledActions: (enabled: boolean) => void;
  setNotifPrefs: (prefs: Partial<NotifPrefs>) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hapticLevel: 'medium',
      hapticsEnabledOnboarding: true,
      hapticsEnabledButtonTaps: true,
      hapticsEnabledActions: true,
      notifPrefs: DEFAULT_NOTIF_PREFS,

      setHapticLevel: (hapticLevel) => set({ hapticLevel }),
      setHapticsEnabledOnboarding: (hapticsEnabledOnboarding) => set({ hapticsEnabledOnboarding }),
      setHapticsEnabledButtonTaps: (hapticsEnabledButtonTaps) => set({ hapticsEnabledButtonTaps }),
      setHapticsEnabledActions: (hapticsEnabledActions) => set({ hapticsEnabledActions }),
      setNotifPrefs: (prefs) => set((state) => ({ notifPrefs: { ...state.notifPrefs, ...prefs } })),
    }),
    {
      name: 'wc-preferences',
      storage: zustandStorage,
    }
  )
);
