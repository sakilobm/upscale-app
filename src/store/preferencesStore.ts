import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type HapticLevel = 'off' | 'soft' | 'light' | 'medium' | 'heavy';

interface PreferencesState {
  hapticLevel: HapticLevel;
  hapticsEnabledOnboarding: boolean;
  hapticsEnabledButtonTaps: boolean;
  hapticsEnabledActions: boolean;
  setHapticLevel: (level: HapticLevel) => void;
  setHapticsEnabledOnboarding: (enabled: boolean) => void;
  setHapticsEnabledButtonTaps: (enabled: boolean) => void;
  setHapticsEnabledActions: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      hapticLevel: 'medium',
      hapticsEnabledOnboarding: true,
      hapticsEnabledButtonTaps: true,
      hapticsEnabledActions: true,

      setHapticLevel: (hapticLevel) => set({ hapticLevel }),
      setHapticsEnabledOnboarding: (hapticsEnabledOnboarding) => set({ hapticsEnabledOnboarding }),
      setHapticsEnabledButtonTaps: (hapticsEnabledButtonTaps) => set({ hapticsEnabledButtonTaps }),
      setHapticsEnabledActions: (hapticsEnabledActions) => set({ hapticsEnabledActions }),
    }),
    {
      name: 'wc-preferences',
      storage: zustandStorage,
    }
  )
);
